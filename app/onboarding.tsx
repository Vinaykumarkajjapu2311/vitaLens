import { useAuth } from '@clerk/expo';
import { AntDesign, Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export default function OnboardingScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { colors, isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [gender, setGender] = useState('Male');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const [activityLevel, setActivityLevel] = useState('Sedentary');

  const [dietaryPreference, setDietaryPreference] = useState('None');
  const [showDietDropdown, setShowDietDropdown] = useState(false);
  const [allergies, setAllergies] = useState('');
  const [allergySeverity, setAllergySeverity] = useState(0);

  const [healthConditions, setHealthConditions] = useState<Record<string, number>>({
    diabetes: 0,
    highBloodPressure: 0,
    highCholesterol: 0,
    pcos: 0,
    thyroidIssues: 0,
  });

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!age || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) {
      newErrors.age = "Please enter a valid age (1-120).";
    }
    if (!height || isNaN(Number(height)) || Number(height) < 50 || Number(height) > 300) {
      newErrors.height = "Please enter a valid height (50-300 cm).";
    }
    if (!weight || isNaN(Number(weight)) || Number(weight) < 20 || Number(weight) > 500) {
      newErrors.weight = "Please enter a valid weight (20-500 kg).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const profileData = {
        gender,
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        dietaryPreference,
        allergies,
        allergySeverity,
        healthConditions
      };

      await SecureStore.setItemAsync('userProfile', JSON.stringify(profileData));
      if (userId) {
        await SecureStore.setItemAsync(`hasCompletedOnboarding_${userId}`, 'true');
      }

      router.replace('/');
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // UI Components
  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((item, index) => {
          const isActive = step === item;
          const isCompleted = step > item;
          return (
            <React.Fragment key={item}>
              <View style={[
                styles.progressCircle,
                { backgroundColor: isDark ? colors.secondary : '#f1f5f9' },
                (isActive || isCompleted) && { backgroundColor: colors.primary }
              ]}>
                {isCompleted ? (
                  <AntDesign name="check" size={12} color="#fff" />
                ) : (
                  <Text variant="caption" weight="bold" color={(isActive || isCompleted) ? '#fff' : colors.textSecondary}>
                    {item}
                  </Text>
                )}
              </View>
              {index < 4 && (
                <View style={[
                  styles.progressLine,
                  { backgroundColor: isDark ? colors.secondary : '#f1f5f9' },
                  step > index + 1 && { backgroundColor: colors.primary }
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const renderRiskScale = (value: number, onValueChange: (val: number) => void, labelText: string) => {
    const levels = [
      { val: 0, label: 'None', color: colors.textSecondary },
      { val: 1, label: 'Low', color: '#22c55e' },
      { val: 2, label: 'Mild', color: '#eab308' },
      { val: 3, label: 'Mod', color: '#f97316' },
      { val: 4, label: 'High', color: '#ef4444' },
      { val: 5, label: 'Severe', color: '#7f1d1d' },
    ];
    const currentLevel = levels.find(l => l.val === value) || levels[0];

    return (
      <View style={{ marginBottom: 28 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text variant="label" color={colors.textSecondary}>{labelText}</Text>
          <View style={[styles.sliderLabelBadge, { backgroundColor: currentLevel.color + '15' }]}>
            <Text variant="caption" weight="bold" style={{ color: currentLevel.color }}>
              {currentLevel.label}
            </Text>
          </View>
        </View>

        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={5}
          step={1}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor={currentLevel.color}
          maximumTrackTintColor={isDark ? colors.secondary : "#f1f5f9"}
          thumbTintColor={currentLevel.color}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: -4 }}>
          {levels.map(l => (
            <Text
              key={l.val}
              variant="caption"
              weight="bold"
              style={{ color: value >= l.val ? currentLevel.color : (isDark ? colors.border : '#cbd5e1') }}
            >
              {l.val}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderDropdown = (
    label: string,
    value: string,
    showOptions: boolean,
    setShowOptions: (val: boolean) => void,
    options: string[],
    onSelect: (val: string) => void
  ) => (
    <View style={[styles.inputGroup, showOptions && { zIndex: 100, elevation: 100 }]}>
      <Text variant="label" color={colors.textSecondary} style={{ marginBottom: 8, marginLeft: 4 }}>{label}</Text>
      <Pressable
        style={[styles.dropdownButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text variant="body" weight="bold">{value}</Text>
        <Feather name={showOptions ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
      </Pressable>

      {showOptions && (
        <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              style={styles.dropdownOption}
              onPress={() => { onSelect(opt); setShowOptions(false); }}
            >
              <Text variant="body" weight={value === opt ? 'bold' : 'normal'} color={value === opt ? colors.text : colors.textSecondary}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text variant="h3" style={{ marginBottom: 10 }}>Your Body Metrics</Text>
      <Text variant="body" color={colors.textSecondary} style={{ marginBottom: 30 }}>This helps us calculate your BMI and daily needs.</Text>

      {renderDropdown("GENDER", gender, showGenderDropdown, setShowGenderDropdown, ["Male", "Female", "Other"], setGender)}

      <Input label="AGE" placeholder="e.g., 25" keyboardType="numeric" value={age} onChangeText={setAge} error={errors.age} />
      <Input label="HEIGHT (CM)" placeholder="e.g., 175" keyboardType="numeric" value={height} onChangeText={setHeight} error={errors.height} />
      <Input label="WEIGHT (KG)" placeholder="e.g., 70" keyboardType="numeric" value={weight} onChangeText={setWeight} error={errors.weight} />
    </View>
  );

  const renderStep2 = () => {
    const levels = [
      { id: 'Sedentary', desc: 'Little or no regular exercise.' },
      { id: 'Lightly Active', desc: 'Light exercise or sports 1-3 days a week.' },
      { id: 'Moderately Active', desc: 'Moderate exercise or sports 3-5 days a week.' },
      { id: 'Very Active', desc: 'Hard exercise or sports 6-7 days a week.' }
    ];

    return (
      <View style={styles.stepContent}>
        <Text variant="h3" style={{ marginBottom: 10 }}>Your Activity Level</Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginBottom: 30 }}>How active are you on a typical day?</Text>

        {levels.map((level) => {
          const isSelected = activityLevel === level.id;
          return (
            <Pressable
              key={level.id}
              style={[
                styles.radioCard,
                { backgroundColor: colors.background, borderColor: colors.border },
                isSelected && { borderColor: colors.primary, backgroundColor: isDark ? colors.secondary : '#f0fdf4' }
              ]}
              onPress={() => setActivityLevel(level.id)}
            >
              <View style={[styles.radioOuter, { borderColor: isDark ? colors.border : '#cbd5e1' }, isSelected && { borderColor: colors.primary }]}>
                {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <View style={styles.radioTextContainer}>
                <Text variant="body" weight="bold" color={isSelected ? colors.primary : colors.text} style={{ marginBottom: 4 }}>{level.id}</Text>
                <Text variant="caption" color={colors.textSecondary}>{level.desc}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text variant="h3" style={{ marginBottom: 10 }}>Diet & Allergies</Text>
      <Text variant="body" color={colors.textSecondary} style={{ marginBottom: 30 }}>Let us know about your dietary choices.</Text>

      {renderDropdown("DIETARY PREFERENCE", dietaryPreference, showDietDropdown, setShowDietDropdown, ["None", "Vegetarian", "Vegan", "Pescatarian", "Keto", "Paleo"], setDietaryPreference)}

      <Input label="FOOD ALLERGIES" placeholder="e.g., Peanuts, Shellfish, Gluten" value={allergies} onChangeText={setAllergies} multiline style={{ height: 80, paddingTop: 16 }} />

      {allergies.length > 0 && renderRiskScale(allergySeverity, setAllergySeverity, "ALLERGY SEVERITY")}
    </View>
  );

  const renderStep4 = () => {
    const conditions = [
      { key: 'diabetes', label: 'Diabetes Risk / Severity' },
      { key: 'highBloodPressure', label: 'High Blood Pressure Severity' },
      { key: 'highCholesterol', label: 'High Cholesterol Severity' },
      { key: 'pcos', label: 'PCOS Severity' },
      { key: 'thyroidIssues', label: 'Thyroid Issues Severity' }
    ] as const;

    return (
      <View style={styles.stepContent}>
        <Text variant="h3" style={{ marginBottom: 10 }}>Health Conditions</Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginBottom: 30 }}>Indicate your risk or severity level for any applicable conditions. This drastically improves AI recommendations.</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 20 }}>
          {conditions.map(({ key, label }) => (
            <View key={key} style={[styles.conditionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {renderRiskScale(healthConditions[key], (val) => setHealthConditions(prev => ({ ...prev, [key]: val })), label)}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStep5 = () => (
    <View style={[styles.stepContent, styles.centerContent]}>
      <View style={[styles.successIconContainer, { backgroundColor: isDark ? colors.secondary : '#d1fae5' }]}>
        <AntDesign name="check" size={40} color={colors.primary} />
      </View>
      <Text variant="h2" align="center" style={{ marginBottom: 10 }}>Ready to Scan!</Text>
      <Text variant="body" align="center" color={colors.textSecondary} style={{ marginHorizontal: 20 }}>
        Your profile is set up. Let's start tracking your health together.
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Card elevated style={{ minHeight: 550, padding: 24, justifyContent: 'space-between', marginTop: 'auto', marginBottom: 'auto' }}>
          {renderProgressBar()}

          <View style={styles.contentArea}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {step < 5 ? (
              <>
                <Button
                  title="BACK"
                  variant="outline"
                  onPress={handleBack}
                  disabled={step === 1}
                  style={[styles.flexButton, { opacity: step === 1 ? 0 : 1 }]}
                />
                <View style={{ width: 12 }} />
                <Button title="NEXT" onPress={handleNext} style={styles.flexButton} />
              </>
            ) : (
              <Button title="Finish" onPress={handleFinish} loading={isSaving} style={{ width: '100%' }} />
            )}
          </View>
        </Card>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, justifyContent: 'center' },
  contentArea: { flex: 1 },
  stepContent: { flex: 1, paddingTop: 10 },
  centerContent: { justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  successIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },

  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 32 },
  progressCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  progressLine: { position: 'absolute', height: 2, top: 13, left: 24, right: 24, zIndex: 1 },

  inputGroup: { marginBottom: 20, position: 'relative', zIndex: 1 },
  dropdownButton: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  dropdownList: { borderRadius: 16, borderWidth: 1, paddingVertical: 8, position: 'absolute', top: 75, left: 0, right: 0, zIndex: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  dropdownOption: { paddingVertical: 12, paddingHorizontal: 16 },

  radioCard: { borderWidth: 1.5, borderRadius: 16, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  radioTextContainer: { flex: 1 },

  conditionCard: { borderWidth: 1.5, borderRadius: 16, padding: 18, marginBottom: 14 },

  sliderLabelBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20, borderTopWidth: 1 },
  flexButton: { flex: 1 },
});
