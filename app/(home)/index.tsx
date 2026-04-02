import { useAuth } from '@clerk/expo';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
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
  macros: {
    carbs: string;
    fat: string;
    protein: string;
  };
  micronutrients: { name: string; value: string }[];
  identifiedItems: {
    name: string;
    weight: string;
    calories: string;
    macros: string;
  }[];
  detailedAnalysis: string;
  healthyImprovements: string[];
  portionGuidance: string;
}

export default function MealAnalyzerScreen() {
  const { signOut } = useAuth();
  const { i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();

  const [appState, setAppState] = useState<'IDLE' | 'ANALYZING' | 'RESULTS'>('IDLE');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysis | null>(null);
  const [showImageNutrients, setShowImageNutrients] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const prevLangRef = React.useRef(i18n.language);

  const getLangName = (code: string) => {
    const map: Record<string, string> = { 'EN': 'English', 'తెలుగు': 'Telugu', 'HI': 'Hindi', 'ES': 'Spanish', 'FR': 'French', 'DE': 'German' };
    return map[code] || code;
  };

  React.useEffect(() => {
    if (analysisResult && appState === 'RESULTS' && prevLangRef.current !== i18n.language) {
      prevLangRef.current = i18n.language;
      translateAnalysis(i18n.language, analysisResult);
    } else {
      prevLangRef.current = i18n.language;
    }
  }, [i18n.language, appState]);

  const translateAnalysis = async (targetLang: string, currentAnalysis: MealAnalysis) => {
    if (!genAI) return;
    setAppState('ANALYZING');
    try {
      const targetLangName = getLangName(targetLang);
      const prompt = `Translate the string values of the following JSON object into the ${targetLangName} language. 
      You MUST keep the exact same JSON key structure. Output strictly raw valid JSON.
      JSON to translate:
      ${JSON.stringify(currentAnalysis)}`;
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      let text = result.response.text();
      if (text.startsWith('```json')) text = text.replace(/```json\n?/, '').replace(/\n?```$/, '').trim();
      else if (text.startsWith('```')) text = text.replace(/```\n?/, '').replace(/\n?```$/, '').trim();
      setAnalysisResult(JSON.parse(text));
    } catch (e) {
      console.error("Translation error", e);
    } finally {
      setAppState('RESULTS');
    }
  };

  const toggleSpeech = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    if (!analysisResult) return;

    const readText = `This is ${analysisResult.name}. 
      It contains ${analysisResult.calories} calories, with ${analysisResult.macros.carbs} of CARBS, 
      ${analysisResult.macros.protein} of PROTEIN, and ${analysisResult.macros.fat} of FAT. 
      ${analysisResult.detailedAnalysis} 
      ${analysisResult.portionGuidance}`;

    setIsSpeaking(true);
    Speech.speak(readText, {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      rate: 0.9,
    });
  };

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error(err); }
  };

  const processImage = async (uri: string, base64: string) => {
    if (!genAI) {
      Alert.alert('Configuration Error', 'EXPO_PUBLIC_GEMINI_API_KEY is missing in your .env file.');
      return;
    }

    setAppState('ANALYZING');
    setImageUri(uri);

    try {
      const profileString = await SecureStore.getItemAsync('userProfile');
      let userContextStr = '';
      if (profileString) {
        const p = JSON.parse(profileString);
        userContextStr = `User Profile Context (personalize the result for this user):
- Weight: ${p.weight || 'unknown'}kg
- Height: ${p.height || 'unknown'}cm
- Diets/Goals: ${p.dietaryPreference || 'none'}
- Allergies: ${p.allergies || 'none'} (Severity 0-5: ${p.allergySeverity || 0})
- Health Conditions (0=None, 1=Low, 2=Mild, 3=Mod, 4=High, 5=Severe):
  Diabetes Risk: ${p.healthConditions?.diabetes || 0}
  Blood Pressure Risk: ${p.healthConditions?.highBloodPressure || 0}
  Cholesterol Risk: ${p.healthConditions?.highCholesterol || 0}
  PCOS Risk: ${p.healthConditions?.pcos || 0}
  Thyroid Risk: ${p.healthConditions?.thyroidIssues || 0}`;
      }

      const targetLangName = getLangName(i18n.language);
      const prompt = `You are an expert nutritionist and food AI.
Analyze the provided food image.
Respond strictly in the ${targetLangName} language.
${userContextStr}

CRITICAL: Emulate a YOLO (You Only Look Once) Object Detection algorithm. Before analyzing the total meal, first scan the provided image and identify EVERY single distinct food item or ingredient you detect in the image as a structural object. Base your final nutritional analysis ONLY on the objects you successfully "detected" in this first YOLO pass. This ensures high accuracy and prevents hallucinating ingredients.

Format your response STRICTLY as a JSON object matching this schema. Do not include markdown codeblocks, just raw JSON:
{
  "name": "General name of the meal based on YOLO detection",
  "allergenNotices": ["List any allergens specific to the user's allergies, or general warnings"],
  "totalGrams": "e.g. 350g",
  "calories": "e.g. 1000",
  "macros": { "carbs": "e.g. 140g", "fat": "e.g. 53g", "protein": "e.g. 14g" },
  "micronutrients": [{"name": "Sodium", "value": "1200mg"}],
  "identifiedItems": [{"name": "Item name (YOLO Detected Object)", "weight": "250g", "calories": "700 kcal", "macros": "Carbs: 100g, Fat: 40g, Protein: 10g"}],
  "detailedAnalysis": "A 1-2 sentence breakdown of what this meal consists of nutritionally.",
  "healthyImprovements": ["Actionable advice 1", "Actionable advice 2"],
  "portionGuidance": "Advice on portion control for this specific meal."
}`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType: 'image/jpeg' } }
          ]
        }],
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
      setImageUri(null);
    }
  };

  const openCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert("Permission", "Camera access needed."); return; }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8, base64: true,
      });
      if (!result.canceled && result.assets[0].base64) processImage(result.assets[0].uri, result.assets[0].base64);
    } catch (error) { console.error("Camera error:", error); }
  };

  const openGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert("Permission", "Gallery access needed."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8, base64: true,
      });
      if (!result.canceled && result.assets[0].base64) processImage(result.assets[0].uri, result.assets[0].base64);
    } catch (error) { console.error("Gallery error:", error); }
  };

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

  if (appState === 'ANALYZING') {
    return (
      <View style={[dynamicStyles.safeArea, { minHeight: height, width }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        {renderTopBar()}
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 24 }} />
          <Text variant="h3" align="center" style={{ marginBottom: 8 }}>Running Object Detection...</Text>
          <Text variant="body" color={colors.textSecondary} align="center">Performing YOLO-pass analysis on your meal to detect precise ingredients.</Text>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={[styles.imagePreview, { opacity: 0.5, marginTop: 40, width: 200, height: 200 }]} />
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
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <Card elevated style={{ marginBottom: 20 }}>
            {/* Header */}
            <View style={styles.resultHeader}>
              <Text variant="h3" style={{ flex: 1, marginRight: 16 }}>{analysisResult.name}</Text>
              <View style={styles.resultHeaderActions}>
                <Pressable style={[styles.iconButton, { backgroundColor: isDark ? colors.secondary : '#f0fdf4' }]} onPress={toggleSpeech}>
                  <Feather name={isSpeaking ? "volume-x" : "volume-2"} size={18} color={colors.primary} />
                </Pressable>
                <Button
                  title={isSpeaking ? "STOP" : "LOG"}
                  onPress={toggleSpeech}
                  size="small"
                  style={{ width: 'auto', paddingHorizontal: 12, height: 36 }}
                />
              </View>
            </View>

            {/* Image Box */}
            <Pressable
              style={styles.resultImageContainer}
              onPressIn={() => setShowImageNutrients(true)}
              onPressOut={() => setShowImageNutrients(false)}
            >
              {imageUri && (
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: imageUri }} style={[styles.resultImage, { borderColor: colors.background }]} />
                  {showImageNutrients && (
                    <View style={styles.imageOverlay}>
                      <Text variant="caption" color={colors.success} weight="bold">NUTRIENTS</Text>
                      <Text variant="caption" color={colors.white}>Kcal: {analysisResult.calories}</Text>
                      <Text variant="caption" color={colors.white}>C: {analysisResult.macros.carbs}</Text>
                      <Text variant="caption" color={colors.white}>F: {analysisResult.macros.fat}</Text>
                      <Text variant="caption" color={colors.white}>P: {analysisResult.macros.protein}</Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>

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

            <Button title="SCAN ANOTHER MEAL" onPress={() => { setAppState('IDLE'); setImageUri(null); }} style={{ marginTop: 16 }} />
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
          <Text variant="h1" align="center" style={{ marginBottom: 8, marginTop: 40 }}>Smart Meal Analyzer</Text>
          <Text variant="body" color={colors.textSecondary} align="center" style={{ marginBottom: 50 }}>Snap a photo of your food for instant feedback.</Text>

          <View style={styles.actionContainer}>
            <Button
              title="SCAN YOUR MEAL"
              icon={<Feather name="camera" size={20} />}
              onPress={openCamera}
              size="large"
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text variant="label" color={colors.textSecondary} style={{ paddingHorizontal: 12 }}>OR UPLOAD</Text>
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
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 20 },

  analyzingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },

  resultScroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  resultHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  resultImageContainer: { alignItems: 'center', marginBottom: 24 },
  resultImage: { width: 140, height: 140, borderRadius: 28, borderWidth: 3 },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 28, justifyContent: 'center', alignItems: 'center', padding: 8, borderWidth: 3, borderColor: 'transparent' },

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