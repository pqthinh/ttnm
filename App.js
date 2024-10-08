import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import AppDrawer from './src/navigation/AppDrawer'
import { LogBox } from 'react-native'
import { Provider } from 'react-redux'
import store, { persistor } from './src/store/store'
import { PersistGate } from 'redux-persist/integration/react'
import useCache from './src/hooks/useCache'
import SplashStack from './src/navigation/SplashStack'
LogBox.ignoreAllLogs()

export default function App() {
  const { set, get } = useCache

  const [userInfo, setUserInfo] = useState()
  useEffect(() => {
    async function getInfo() {
      const info = await get('@app/get_user_info')
      console.log('user info get from home : ----> ', info)
      setUserInfo(info)
    }
    getInfo()
  }, [])

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          {userInfo ? (
            <>
              <AppDrawer />
            </>
          ) : (
            <SplashStack />
          )}
        </NavigationContainer>
      </PersistGate>
    </Provider>
  )
}
