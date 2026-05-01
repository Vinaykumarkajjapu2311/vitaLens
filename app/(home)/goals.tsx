import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export default function GoalsScreen() {
  const { signOut, userId } = useAuth();
  const { user } = useUser();
  const { i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLang, setShowLang] = useState(false);

  const [weightVal, setWeightVal] = useState('');
  const [heightVal, setHeightVal] = useState('');
  const [goalVal, setGoalVal] = useState('');
  const [allergiesVal, setAllergiesVal] = useState('');

  const [planType, setPlanType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await SecureStore.getItemAsync('userProfile');
        if (data) {
          const p = JSON.parse(data);
          setProfileData(p);
          setWeightVal(String(p.weight || ''));
          setHeightVal(String(p.height || ''));
          setGoalVal(p.dietaryPreference || '');
          setAllergiesVal(p.allergies || '');
        }
      } catch (e) {
        console.error('Failed to load profile data', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const saveToStore = async (field: string, val: string | number) => {
    if (!profileData) return;
    const newData = { ...profileData, [field]: val };
    try {
      await SecureStore.setItemAsync('userProfile', JSON.stringify(newData));
      setProfileData(newData);
    } catch (e) {
      console.error('Failed to update local store', e);
    }
  };

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error('Error signing out:', err); }
  };

  const generateMealPlan = async () => {
    if (!genAI) { alert('EXPO_PUBLIC_GEMINI_API_KEY is missing.'); return; }
    setIsGeneratingPlan(true);
    setGeneratedPlan(null);

    const dates: string[] = [];
    const today = new Date();
    if (planType === 'Daily') {
      dates.push(today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    } else if (planType === 'Weekly') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      }
    } else if (planType === 'Monthly') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= numDays; i++) {
        const d = new Date(year, month, i);
        dates.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      }
    }

    const userContextStr = `User Profile Context:
- Weight: ${weightVal}kg
- Height: ${heightVal}cm
- Diet Goal: ${goalVal || 'none'}
- Allergies: ${allergiesVal || 'none'}
- Allergy Severity (0-5): ${profileData?.allergySeverity || 0}
- Health Conditions:
  Diabetes: ${profileData?.healthConditions?.diabetes || 0}
  BP: ${profileData?.healthConditions?.highBloodPressure || 0}
  Cholesterol: ${profileData?.healthConditions?.highCholesterol || 0}
  PCOS: ${profileData?.healthConditions?.pcos || 0}
  Thyroid: ${profileData?.healthConditions?.thyroidIssues || 0}`;

    const prompt = `You are an expert app nutritionist. Generate a **${planType}** meal plan explicitly tailored to the User Profile Context provided (honoring their health condition severities and allergies). The cuisine and recipes MUST be strictly Indian style. Use extremely recognizable, popular Indian dishes and names.
${userContextStr}

Return ONLY raw JSON matching this format:
{
  "title": "A catchy title for this plan",
  "description": "Short explanation of why this fits the user's goals and health restrictions",
  "averageDailyCalories": 2000,
  "days": [
    {
      "dayName": "Mon, Apr 1",
      "meals": [
        { "type": "Breakfast", "name": "Meal name", "calories": 300 },
        { "type": "Lunch", "name": "Meal name", "calories": 500 },
        { "type": "Snack", "name": "Meal name", "calories": 200 },
        { "type": "Dinner", "name": "Meal name", "calories": 600 }
      ]
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY ${dates.length} items in the "days" array.
2. "dayName" MUST perfectly match: ${dates.join(', ')}
3. 4 meals per day.
4. Adhere to allergies and health conditions.
Do NOT skip any days.`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      let responseText = result.response.text();
      if (responseText.startsWith('\`\`\`json')) responseText = responseText.replace(/\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '').trim();
      else if (responseText.startsWith('\`\`\`')) responseText = responseText.replace(/\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '').trim();

      const parsed = JSON.parse(responseText);
      setGeneratedPlan(parsed);
    } catch (error) {
      console.error(error);
      alert('Failed to generate plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const getPdfHtml = () => {
    if (!generatedPlan) return '';
    let html = `
      <html><head><style>
        body { font-family: sans-serif; padding: 30px; color: #333; }
        h1 { color: #0a8f60; text-align: center; }
        p { text-align: center; color: #666; }
        .cal-target { font-weight: bold; text-align: center; margin-bottom: 30px; color: #0a8f60; padding: 10px; background-color: #f0fdf4; border-radius: 8px; }
        .day-card { border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; margin-bottom: 25px; background-color: #f8fafc; }
        .day-title { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #e6f4ea; color: #0a8f60; }
        .cal-col { color: #0a8f60; font-weight: bold; text-align: right; }
      </style></head><body>
      <h1>${generatedPlan.title}</h1>
      <p>${generatedPlan.description}</p>
      <div class="cal-target">Target Daily Calories: ${generatedPlan.averageDailyCalories} kcal</div>`;

    generatedPlan.days.forEach((day: any) => {
      html += `<div class="day-card"><h2 class="day-title">${day.dayName}</h2><table><tr><th>Type</th><th>Meal</th><th style="text-align: right;">Calories</th></tr>`;
      day.meals.forEach((meal: any) => {
        html += `<tr><td><strong>${meal.type}</strong></td><td>${meal.name}</td><td class="cal-col">${meal.calories} kcal</td></tr>`;
      });
      html += `</table></div>`;
    });
    html += `</body></html>`;
    return html;
  };

  const handleSharePDF = async () => {
    if (!generatedPlan) return;
    try {
      const html = getPdfHtml();
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else alert('Sharing is not available. File saved to: ' + uri);
    } catch (error) { console.error(error); alert('Failed to generate PDF'); }
  };

  const handleDownloadPDF = async () => {
    if (!generatedPlan) return;
    try {
      const html = getPdfHtml();

      if (Platform.OS === 'android') {
        let hasPermission = false;

        if (Platform.Version >= 33) {
          // On Android 13+ downloading documents to Public Download folder does not strictly demand WRITE_EXTERNAL_STORAGE. We can directly write. 
          hasPermission = true;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'VitaLens needs access to your storage to download the PDF.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (hasPermission) {
          const { uri } = await Print.printToFileAsync({ html });
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

          const downloadsFolder = 'file:///storage/emulated/0/Download/';
          const fileName = `MealPlan_${Date.now()}.pdf`;
          const fileUri = downloadsFolder + fileName;

          await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
          Alert.alert("Success", "Meal Plan downloaded to your Downloads folder!");
        } else {
          Alert.alert("Permission Required", "Storage permission is needed to download files directly.");
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          Alert.alert("Info", "To download on iOS, please select 'Save to Files' in the share sheet.");
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } else {
          alert("Sharing is not available on this device.");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to download PDF! Please check permissions and try again.");
    }
  };

  const getInitials = () => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    if (user?.primaryEmailAddress?.emailAddress) return user.primaryEmailAddress.emailAddress.charAt(0).toUpperCase();
    return 'V';
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }, { minHeight: height, width }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainerOuter, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
              <View style={[styles.avatarContainerInner, { backgroundColor: isDark ? colors.primaryLight : '#e6f4ea' }]}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            </View>
            <Text variant="h3">{user?.fullName || user?.primaryEmailAddress?.emailAddress.split('@')[0] || 'User'}</Text>
            <Text variant="caption" color={colors.textSecondary}>{user?.primaryEmailAddress?.emailAddress || 'No Email'}</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Card elevated style={{ marginBottom: 24 }}>
              <Text variant="label" color={colors.textSecondary} style={{ marginBottom: 24 }}>PROFILE DATA</Text>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Input
                    label="WEIGHT"
                    value={weightVal}
                    onChangeText={setWeightVal}
                    onBlur={() => saveToStore('weight', Number(weightVal) || 0)}
                    keyboardType="numeric"
                    placeholder="e.g. 70"
                    rightIcon={<Text variant="body" color={colors.textSecondary} style={{ marginRight: 16 }}>kg</Text>}
                  />
                </View>
                <View style={styles.col}>
                  <Input
                    label="HEIGHT"
                    value={heightVal}
                    onChangeText={setHeightVal}
                    onBlur={() => saveToStore('height', Number(heightVal) || 0)}
                    keyboardType="numeric"
                    placeholder="e.g. 175"
                    rightIcon={<Text variant="body" color={colors.textSecondary} style={{ marginRight: 16 }}>cm</Text>}
                  />
                </View>
              </View>

              <Input
                label="GOAL"
                value={goalVal}
                onChangeText={setGoalVal}
                onBlur={() => saveToStore('dietaryPreference', goalVal)}
                placeholder="e.g. None or Weight Loss"
              />

              <Input
                label="ALLERGIES"
                value={allergiesVal}
                onChangeText={setAllergiesVal}
                onBlur={() => saveToStore('allergies', allergiesVal)}
                placeholder="e.g. Peanuts, Milk"
                multiline
                style={{ height: 80, paddingTop: 16 }}
              />
            </Card>
          )}

          <Card elevated>
            <Text variant="label" color={colors.textSecondary} style={{ marginBottom: 24 }}>AI MEAL PLANNER</Text>

            <View style={styles.planTypeContainer}>
              {['Daily', 'Weekly', 'Monthly'].map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.planTypeBtn,
                    { backgroundColor: planType === type ? (isDark ? colors.primaryLight : '#e6f4ea') : colors.background },
                    { borderColor: planType === type ? colors.primary : colors.border }
                  ]}
                  onPress={() => setPlanType(type as any)}
                >
                  <Text variant="caption" style={{ fontWeight: planType === type ? '900' : '700' }} color={planType === type ? colors.primary : colors.textSecondary}>{type}</Text>
                </Pressable>
              ))}
            </View>

            <Button
              title={`Generate ${planType} Plan`}
              onPress={generateMealPlan}
              loading={isGeneratingPlan}
            />

            {generatedPlan && (
              <View style={[styles.planResultContainer, { borderTopColor: colors.border }]}>
                <Text variant="h3" style={{ marginBottom: 8 }}>{generatedPlan.title}</Text>
                <Text variant="body" color={colors.textSecondary} style={{ marginBottom: 16 }}>{generatedPlan.description}</Text>

                <View style={[styles.planCalContainer, { backgroundColor: isDark ? colors.secondary : '#f0fdf4' }]}>
                  <Text variant="caption" color={isDark ? colors.text : '#065f46'} weight="bold">Target Daily Calories: </Text>
                  <Text variant="body" color={colors.primary} weight="900">{generatedPlan.averageDailyCalories} kcal</Text>
                </View>

                <View style={styles.actionRow}>
                  <Button variant="outline" size="small" style={{ flex: 1 }} icon={<Feather name="share" size={16} />} title="Share" onPress={handleSharePDF} />
                </View>

                {generatedPlan.days?.map((day: any, i: number) => (
                  <View key={i} style={[styles.dayCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text variant="body" weight="900" style={{ marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>{day.dayName}</Text>
                    {day.meals?.map((meal: any, j: number) => (
                      <View key={j} style={styles.mealRow}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text variant="label" color={colors.textSecondary} style={{ marginBottom: 2 }}>{meal.type}</Text>
                          <Text variant="caption" weight="bold">{meal.name}</Text>
                        </View>
                        <Text variant="caption" color={colors.primary} weight="bold">{meal.calories} kcal</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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

  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 130, alignItems: 'center' },

  profileHeader: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  avatarContainerOuter: { width: 90, height: 90, borderRadius: 45, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarContainerInner: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#0a8f60' },

  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },

  planTypeContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  planTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },

  planResultContainer: { marginTop: 24, borderTopWidth: 1, paddingTop: 20 },
  planCalContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },

  dayCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }
});
