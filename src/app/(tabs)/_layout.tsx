import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import Svg, { Path } from 'react-native-svg';

const TodayIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M20.779 10.007a9 9 0 1 0 -10.77 10.772" />
    <Path d="M13 21h8v-7" />
    <Path d="M12 8v4l3 3" />
  </Svg>
);

const CategoryIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M4 4h6v6h-6l0 -6" />
    <Path d="M14 4h6v6h-6l0 -6" />
    <Path d="M4 14h6v6h-6l0 -6" />
    <Path d="M14 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
  </Svg>
);

const VaultIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M12 13v.01" />
    <Path d="M10 16v.01" />
    <Path d="M14 16v.01" />
    <Path d="M7.5 8h9l-.281 -2.248a2 2 0 0 0 -1.985 -1.752h-4.468a2 2 0 0 0 -1.986 1.752l-.28 2.248" />
    <Path d="M7.5 8l-1.612 9.671a2 2 0 0 0 1.973 2.329h8.278a2 2 0 0 0 1.973 -2.329l-1.612 -9.671" />
  </Svg>
);

const DashboardIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M10 13a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <Path d="M13.45 11.55l2.05 -2.05" />
    <Path d="M6.4 20a9 9 0 1 1 11.2 0l-11.2 0" />
  </Svg>
);

const TimetableIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <Path d="M16 3l0 4" />
    <Path d="M8 3l0 4" />
    <Path d="M4 11l16 0" />
    <Path d="M8 15l2 0" />
    <Path d="M14 15l2 0" />
    <Path d="M8 19l2 0" />
    <Path d="M14 19l2 0" />
  </Svg>
);

const SettingsIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37.996 .608 2.296 .07 2.572 -1.065z" />
    <Path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
  </Svg>
);

export default function TabLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.onPrimary,
        tabBarInactiveTintColor: '#9AA0A6',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 20,
          height: 68,
          backgroundColor: colors.text,
          borderTopWidth: 0,
          borderRadius: 32,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
        tabBarItemStyle: {
          borderRadius: 24,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 0,
        },
        headerShadowVisible: false,
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <TodayIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => <CategoryIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ color, size }) => <TimetableIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color, size }) => <VaultIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <DashboardIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
