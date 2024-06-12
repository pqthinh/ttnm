import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import AppDrawer from './src/navigation/AppDrawer'
import { VoiceControlComponent } from './src/component/VoiceControl'
import { View } from 'react-native'
import { Provider } from 'react-redux'
import store, {persistor} from './src/store/store'
import { PersistGate } from 'redux-persist/integration/react'

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <View style={{ height: '100%' }}>
          <NavigationContainer>
            <AppDrawer />
          </NavigationContainer>
          <View style={{ height: 80 }}>
            <VoiceControlComponent />
          </View>
        </View>
      </PersistGate>
    </Provider>
  )
}
