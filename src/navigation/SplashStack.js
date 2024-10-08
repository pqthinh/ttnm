import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import SplashScreen from '../screen/SplashScreen'
import UserInfoScreen from '../screen/UserInfoScreen'
import AppDrawer from './AppDrawer'
import SettingsScreen from '../screen/SettingsScreen'

const Stack = createStackNavigator()

const SplashStack = () => {
  return (
    <Stack.Navigator headerShown='none'>
      <Stack.Screen
        name='SplashScreen'
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='UserInfoScreen'
        component={UserInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='HomeStack'
        component={AppDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='SettingScreen'
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}

export default SplashStack
