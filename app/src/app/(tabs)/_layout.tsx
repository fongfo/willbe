import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue, StyleSheet, View } from 'react-native';

type TabRoute = 'home' | 'plan' | 'readiness' | 'assistant' | 'account';
type FeatherIconName = 'home' | 'clipboard' | 'activity' | 'message-circle' | 'user';

const tabIcons: Record<TabRoute, FeatherIconName> = {
  home: 'home',
  plan: 'clipboard',
  readiness: 'activity',
  assistant: 'message-circle',
  account: 'user',
};

function TabIcon({ name, color, focused }: { name: FeatherIconName; color: ColorValue; focused: boolean }) {
  return (
    <View style={[styles.iconShell, focused ? styles.iconShellActive : undefined]}>
      <Feather name={name} size={20} color={String(color)} strokeWidth={focused ? 2.6 : 2.1} />
    </View>
  );
}

function screenOptionsFor(route: TabRoute, title: string) {
  return {
    title,
    tabBarAccessibilityLabel: `${title} tab`,
    tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean }) => (
      <TabIcon name={tabIcons[route]} color={color} focused={focused} />
    ),
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#8a9b95',
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="home" options={screenOptionsFor('home', 'Home')} />
      <Tabs.Screen name="plan" options={screenOptionsFor('plan', 'Plan')} />
      <Tabs.Screen name="readiness" options={screenOptionsFor('readiness', 'Readiness')} />
      <Tabs.Screen name="assistant" options={screenOptionsFor('assistant', 'AI')} />
      <Tabs.Screen name="account" options={screenOptionsFor('account', 'Account')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 82,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fbfdfc',
    borderTopWidth: 1,
    borderTopColor: '#e4ece8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#0c211d',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 18,
  },
  tabItem: {
    minHeight: 58,
    paddingVertical: 2,
  },
  tabLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '700',
  },
  iconShell: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShellActive: {
    backgroundColor: '#dcefe9',
    borderWidth: 1,
    borderColor: '#c4e0d7',
  },
});
