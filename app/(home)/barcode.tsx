import { useAuth } from '@clerk/expo';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface MealAnalysis {
  name: string;
  allergenNotices: string[];
  totalGrams: string;
  calories: string;
  macros: { carbs: string; fat: string; protein: string; };
  micronutrients: { name: string; value: string }[];
  identifiedItems: { name: string; weight: string; calories: string; macros: string; }[];
  detailedAnalysis: string;
  healthyImprovements: string[];
  portionGuidance: string;
}

export default function BarcodeScreen() {
  const { signOut } = useAuth();
  const { i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();

  const [appState, setAppState] = useState<'IDLE' | 'SCANNING' | 'ANALYZING' | 'RESULTS'>('IDLE');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysis | null>(null);
  const [showLang, setShowLang] = useState(false);

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error(err); }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const resp = await requestPermission();
      if (!resp.granted) {
        Alert.alert("Permission Required", "Camera access is needed to scan barcodes.");
        return;
      }
    }
    setAppState('SCANNING');
  };

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (appState !== 'SCANNING') return; // Prevent multiple reads
    setAppState('ANALYZING');
    setScannedBarcode(data);
    await processBarcode(data);
  };

  const processBarcode = async (barcode: string) => {
    if (!genAI) {
      Alert.alert('Configuration Error', 'EXPO_PUBLIC_GEMINI_API_KEY is missing in your .env file.');
      return;
    }

    try {
      // 1. Fetch from OpenFoodFacts
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const offData = await offResponse.json();

      let offContext = 'No data found in Open Food Facts database for this barcode. Try to infer the product from the barcode format or general knowledge.';
      let imgUrl = null;

      if (offData.status === 1 && offData.product) {
        const product = offData.product;
        imgUrl = product.image_front_url || product.image_url;
        setProductImage(imgUrl);

        offContext = `
Open Food Facts Analysis Results:
- Product Name: ${product.product_name || product.product_name_en || 'Unknown'}
- Brands: ${product.brands || 'Unknown'}
- Ingredients: ${product.ingredients_text || 'Unknown'}
- Allergens: ${product.allergens || product.allergens_tags?.join(', ') || 'Unknown'}
- Nutriments (per 100g or serving):
  - Energy: ${product.nutriments?.energy_kcal || product.nutriments?.energy || 'Unknown'} kcal
  - Proteins: ${product.nutriments?.proteins || 'Unknown'}
  - Carbs: ${product.nutriments?.carbohydrates || 'Unknown'}
  - Fat: ${product.nutriments?.fat || 'Unknown'}
  - Sugars: ${product.nutriments?.sugars || 'Unknown'}
  - Fiber: ${product.nutriments?.fiber || 'Unknown'}
  - Calcium: ${product.nutriments?.calcium || 'Unknown'}
  - Iron: ${product.nutriments?.iron || 'Unknown'}
  - Sodium: ${product.nutriments?.sodium || 'Unknown'}
- Serving Size: ${product.serving_size || 'Unknown'}
- Quantity: ${product.quantity || 'Unknown'}
`;
      } else {
        setProductImage(null);
      }

      // 2. Fetch User Context
      const profileString = await SecureStore.getItemAsync('userProfile');
      let userContextStr = '';
      if (profileString) {
        const p = JSON.parse(profileString);
        userContextStr = `User Profile Context (personalize the result for this user):
- Weight: ${p.weight || 'unknown'}kg
- Height: ${p.height || 'unknown'}cm
- Diets/Goals: ${p.dietaryPreference || 'none'}
- Allergies: ${p.allergies || 'none'}`;
      }

      // 3. Prompt Gemini
      const prompt = `You are an expert nutritionist and food AI.
The user scanned a barcode with the value: ${barcode}.

${offContext}

${userContextStr}

Analyze the raw Open Food Facts data context and format an output based on the user profile. If Open Food Facts lacked data, try to guess what product might have that barcode or provide general plausible medical or nutritional advice assuming it's a typical consumer packaged good.
Format your response STRICTLY as a JSON object matching this schema. Do not include markdown codeblocks, just raw JSON:
{
  "name": "General name of the meal/product",
  "allergenNotices": ["List any allergens specific to the user's allergies, or general warnings"],
  "totalGrams": "e.g. 80g",
  "calories": "e.g. 369",
  "macros": { "carbs": "e.g. 61g", "fat": "e.g. 11.6g", "protein": "e.g. 5.2g" },
  "micronutrients": [{"name": "Calcium", "value": "32mg"}, {"name": "Iron", "value": "1.2mg"}],
  "identifiedItems": [{"name": "Item name", "weight": "80g", "calories": "369 kcal", "macros": "Carbs: 61g, Fat: 11.6g, Protein: 5.2g"}],
  "detailedAnalysis": "A detailed 2-3 sentence breakdown of what this product consists of nutritionally. e.g. 'Parle-G Gold is a premium variant...'",
  "healthyImprovements": ["Actionable advice 1", "Actionable advice 2"],
  "portionGuidance": "Advice on portion control for this specific meal."
}`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      let responseText = result.response.text();
      if (responseText.startsWith('```json')) responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '').trim();
      else if (responseText.startsWith('```')) responseText = responseText.replace(/```\n?/, '').replace(/\n?```$/, '').trim();

      const parsed: MealAnalysis = JSON.parse(responseText);

      setAnalysisResult(parsed);
      setAppState('RESULTS');
    } catch (error) {
      console.error('Gemini Analysis Error:', error);
      Alert.alert('Analysis Failed', `Error: ${error instanceof Error ? error.message : String(error)}`);
      setAppState('IDLE');
      setScannedBarcode(null);
    }
  };

  const cancelScanning = () => setAppState('IDLE');

  const resetScanner = () => {
    setAppState('IDLE');
    setAnalysisResult(null);
    setScannedBarcode(null);
    setProductImage(null);
  }

  const renderTopBar = () => (
    <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: isDark ? colors.background : colors.white }]}>
      <Text variant="h3" color={colors.primary} weight="900" style={{ letterSpacing: -0.5 }}>
        Vita<Text variant="h3" color={isDark ? colors.text : '#022c22'} weight="900">Lens</Text>
      </Text>
      <View style={styles.topBarRight}>
        <Pressable onPress={toggleTheme} style={styles.themeToggle}>
          <Feather name={isDark ? "sun" : "moon"} size={20} color={colors.textSecondary} />
        </Pressable>
        <View style={{ position: 'relative', zIndex: 100 }}>
          <Pressable style={styles.langSelector} onPress={() => setShowLang(!showLang)}>
            <Text variant="label" color={colors.text}>{i18n.language.toUpperCase()}</Text>
            <Feather name={showLang ? "chevron-up" : "chevron-down"} size={14} color={colors.text} />
          </Pressable>
          {showLang && (
            <View style={[styles.langDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {['EN', 'తెలుగు', 'HI', 'ES', 'FR', 'DE'].map((ln) => (
                <Pressable key={ln} style={styles.langOption} onPress={() => { i18n.changeLanguage(ln); setShowLang(false); }}>
                  <Text variant="caption" color={i18n.language === ln ? colors.primary : colors.textSecondary} style={{ fontWeight: i18n.language === ln ? '900' : '700' }}>
                    {ln}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={14} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );

  const dynamicStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  });

  if (appState === 'SCANNING') {
    return (
      <View style={[dynamicStyles.safeArea, { minHeight: height, width }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={appState === 'SCANNING' ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "upc_e"],
          }}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <Pressable style={styles.backButton} onPress={cancelScanning}>
                <Feather name="arrow-left" size={24} color="#fff" />
              </Pressable>
              <Text variant="h4" color="#fff" style={{ letterSpacing: 1, fontWeight: '800' }}>Scan Barcode</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.scannerGuide}>
              <View style={[styles.corner, styles.topLeftCorner, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.topRightCorner, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomLeftCorner, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomRightCorner, { borderColor: colors.primary }]} />
              <View style={[styles.laserLine, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
            </View>
            <Text variant="caption" color="#fff" weight="600" style={{ marginTop: 40, letterSpacing: 0.5 }}>
              Align the barcode within the frame
            </Text>
          </View>
        </CameraView>
      </View>
    );
  }

  if (appState === 'ANALYZING') {
    return (
      <View style={[dynamicStyles.safeArea, { minHeight: height, width }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        {renderTopBar()}
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 24 }} />
          <Text variant="h3" align="center" style={{ marginBottom: 8 }}>Our AI is analyzing the barcode...</Text>
          <Text variant="body" color={colors.textSecondary} align="center">Fetching Open Food Facts and evaluating ingredients.</Text>
          {scannedBarcode && (
            <View style={[styles.barcodeIconPlaceholder, { backgroundColor: isDark ? colors.secondary : '#f8fafc' }]}>
              <AntDesign name="barcode" size={80} color={colors.textSecondary} />
              <Text variant="h4" color={colors.textSecondary} style={{ marginTop: 10 }}>{scannedBarcode}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (appState === 'RESULTS' && analysisResult) {
    return (
      <View style={[dynamicStyles.safeArea, { minHeight: height, width }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        {renderTopBar()}
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>

          <Card elevated style={{ marginBottom: 20 }}>
            {/* Header */}
            <View style={styles.resultHeader}>
              <Text variant="h3" style={{ flex: 1, marginRight: 16 }}>{analysisResult.name}</Text>
              <View style={styles.resultHeaderActions}>
                <Pressable style={[styles.iconButton, { backgroundColor: isDark ? colors.secondary : '#f0fdf4' }]}>
                  <Feather name="volume-2" size={18} color={colors.primary} />
                </Pressable>
                <Button title="LOG" size="small" style={{ width: 'auto', paddingHorizontal: 12, height: 36 }} />
              </View>
            </View>

            {/* Image Box */}
            <View style={styles.resultImageContainer}>
              {productImage ? (
                <Image source={{ uri: productImage }} style={[styles.resultImage, { borderColor: colors.border, backgroundColor: colors.background }]} />
              ) : (
                <View style={[styles.barcodeVisual, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                  <AntDesign name="barcode" size={80} color={colors.text} />
                  <Text variant="h4" style={{ marginTop: 10, letterSpacing: 3 }}>{scannedBarcode}</Text>
                </View>
              )}
            </View>

            {/* Allergens */}
            {analysisResult.allergenNotices && analysisResult.allergenNotices.length > 0 && (
              <View style={[styles.allergenBox, { backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}>
                <View style={styles.allergenHeader}>
                  <AntDesign name="warning" size={12} color={isDark ? '#fca5a5' : '#b45309'} />
                  <Text variant="label" color={isDark ? '#fca5a5' : '#991b1b'}>ALLERGEN NOTICE</Text>
                </View>
                {analysisResult.allergenNotices.map((notice, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: isDark ? '#fca5a5' : '#b45309' }]} />
                    <Text variant="caption" color={isDark ? '#fecaca' : '#7f1d1d'} style={{ flex: 1, fontWeight: '600' }}>{notice}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text variant="label" color={colors.textSecondary} align="center" style={{ marginBottom: 16 }}>ADJUST ESTIMATED WEIGHT</Text>

            {/* High Level Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: isDark ? colors.secondary : '#f0fdf4', borderColor: isDark ? colors.border : '#bbf7d0' }]}>
                <Text variant="label" color={colors.textSecondary} style={{ marginBottom: 8 }}>GRAMS</Text>
                <Text variant="h3">{analysisResult.totalGrams}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text variant="label" color={colors.textSecondary} style={{ marginBottom: 8 }}>CALORIES</Text>
                <Text variant="h3" color={colors.primary}>
                  {analysisResult.calories}
                  <Text variant="caption" color={colors.primary}> kcal</Text>
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text variant="label" color={colors.textSecondary} style={{ marginBottom: 8 }}>MACROS</Text>
                <Text variant="caption" color={colors.textSecondary} style={{ fontSize: 10 }}>P: {analysisResult.macros.protein}</Text>
                <Text variant="caption" color={colors.textSecondary} style={{ fontSize: 10 }}>C: {analysisResult.macros.carbs}</Text>
                <Text variant="caption" color={colors.textSecondary} style={{ fontSize: 10 }}>F: {analysisResult.macros.fat}</Text>
              </View>
            </View>

            {/* Micro / Identified Items Row */}
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <Text variant="label" color={colors.primary} style={{ marginBottom: 12 }}>MICRONUTRIENTS</Text>
                {analysisResult.micronutrients.map((m, i) => (
                  <View key={i} style={[styles.splitRowItem, { borderBottomColor: colors.border }]}>
                    <Text variant="caption" color={colors.textSecondary}>{m.name}</Text>
                    <Text variant="caption" weight="bold">{m.value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.splitColRight}>
                <View style={styles.splitRightTitleRow}>
                  <Text variant="label" color={colors.primary}>IDENTIFIED ITEMS</Text>
                </View>
                {analysisResult.identifiedItems.map((item, i) => (
                  <View key={i} style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.itemCardTop}>
                      <Text variant="caption" weight="bold" style={{ flex: 1, marginRight: 8 }} numberOfLines={2}>{item.name}</Text>
                      <Text variant="caption" color={colors.primary} weight="bold">{item.weight}</Text>
                    </View>
                    <View style={styles.itemCardBottom}>
                      <Text variant="caption" color={colors.textSecondary} style={{ fontSize: 10, minWidth: 45 }}>{item.calories} kcal</Text>
                      <Text variant="caption" color={colors.textSecondary} style={{ fontSize: 10, flex: 1 }}>{item.macros}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Detailed Analysis */}
            <Text variant="label" color={colors.primary} style={{ marginBottom: 12, marginTop: 12 }}>DETAILED ANALYSIS</Text>
            <View style={[styles.grayBox, { backgroundColor: colors.background }]}>
              <Text variant="body" color={colors.textSecondary} style={{ lineHeight: 22 }}>{analysisResult.detailedAnalysis}</Text>
            </View>

            {/* Healthy Improvements */}
            {analysisResult.healthyImprovements && analysisResult.healthyImprovements.length > 0 && (
              <>
                <View style={styles.iconTitleRow}>
                  <MaterialCommunityIcons name="star-four-points" size={14} color="#f59e0b" />
                  <Text variant="label" color={colors.primary} style={{ marginLeft: 6 }}>HEALTHY IMPROVEMENTS</Text>
                </View>
                {analysisResult.healthyImprovements.map((imp, idx) => (
                  <View key={idx} style={[styles.greenPillBox, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: isDark ? '#047857' : '#d1fae5' }]}>
                    <Text variant="caption" color={isDark ? '#34d399' : '#065f46'} weight="bold">{imp}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Portion Guidance */}
            <Text variant="label" color={colors.primary} style={{ marginTop: 16, marginBottom: 12 }}>PORTION GUIDANCE</Text>
            <View style={[styles.grayBox, { backgroundColor: colors.background }]}>
              <Text variant="body" color={colors.textSecondary} style={{ fontStyle: 'italic', lineHeight: 22 }}>
                {analysisResult.portionGuidance}
              </Text>
            </View>

            <Button title="SCAN NEW BARCODE" onPress={resetScanner} style={{ marginTop: 16 }} />
          </Card>
        </ScrollView>
      </View>
    );
  }

  // IDLE STATE
  return (
    <View style={[dynamicStyles.safeArea, { minHeight: height, width }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <View style={{ flex: 1 }}>
        {renderTopBar()}

        <View style={styles.content}>
          <Text variant="h1" align="center" style={{ marginBottom: 8, marginTop: 40 }}>Barcode Scan</Text>
          <Text variant="body" color={colors.textSecondary} align="center" style={{ marginBottom: 50 }}>Instantly scan packages for nutritional feedback.</Text>

          <View style={styles.actionContainer}>
            <Button
              title="SCAN BARCODE"
              icon={<AntDesign name="barcode" size={20} />}
              onPress={startScanning}
              size="large"
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text variant="label" color={colors.textSecondary} style={{ paddingHorizontal: 12 }}>OR MEAL ANALYZER</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, zIndex: 50 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  themeToggle: { padding: 4 },
  langSelector: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langDropdown: { position: 'absolute', top: 30, right: 0, borderRadius: 12, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10, borderWidth: 1, minWidth: 80 },
  langOption: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  logoutButton: { padding: 4 },

  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 100 },
  actionContainer: { width: '100%', marginBottom: 10 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '60%', marginTop: 35 },
  dividerLine: { flex: 1, height: 1 },

  cameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  cameraHeader: { position: 'absolute', top: Platform.OS === 'android' ? 50 : 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, alignItems: 'center' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  scannerGuide: { width: 250, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderWidth: 4 },
  topLeftCorner: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  topRightCorner: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  bottomLeftCorner: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  bottomRightCorner: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  laserLine: { width: '100%', height: 2, position: 'absolute', top: '50%', opacity: 0.8, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 4 },

  analyzingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  barcodeIconPlaceholder: { marginTop: 40, alignItems: 'center', padding: 30, borderRadius: 24, width: 200 },

  resultScroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  resultHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  resultImageContainer: { alignItems: 'center', marginBottom: 24, width: '100%' },
  resultImage: { width: 140, height: 140, borderRadius: 28, borderWidth: 2 },
  barcodeVisual: { padding: 24, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },

  allergenBox: { borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1 },
  allergenHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  bullet: { width: 4, height: 4, borderRadius: 2, marginTop: 7, marginRight: 8 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 32 },
  statBox: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1 },

  splitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 20, marginBottom: 32 },
  splitCol: { flex: 1 },
  splitColRight: { flex: 1.2 },

  splitRowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  splitRightTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  itemCard: { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  itemCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' },
  itemCardBottom: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },

  grayBox: { borderRadius: 16, padding: 16, marginBottom: 24 },

  iconTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  greenPillBox: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 10, borderWidth: 1 }
});
