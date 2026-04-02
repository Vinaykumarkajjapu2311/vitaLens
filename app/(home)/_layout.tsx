import { AntDesign, Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function HomeLayout() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            padding: 30,
            backgroundColor: colors.card,
            shadowColor: isDark ? 'transparent' : '#000',
            borderColor: isDark ? colors.border : 'transparent',
            borderWidth: isDark ? 1 : 0,
          }
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_meal'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? colors.primaryLight : colors.primaryLight }]}>
              <Feather name="camera" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="barcode"
        options={{
          title: t('tab_barcode'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? colors.primaryLight : colors.primaryLight }]}>
              <AntDesign name="barcode" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('tab_goals'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? colors.primaryLight : colors.primaryLight }]}>
              <AntDesign name="check-circle" size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    elevation: 30,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    height: Platform.OS === 'ios' ? 80 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    borderRadius: 32,
    marginBottom: 20,
    marginHorizontal: 20,
    position: 'absolute',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  iconContainer: {

    borderRadius: 12,
  },
});