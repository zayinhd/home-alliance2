// screens/RoleSelect.tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'

export default function RoleSelect({ navigation }) {
  const { user } = useAuth()
  // Determine available roles (e.g. from user metadata or profile)
  // For simplicity, assume both contractor and customer are always options
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-xl font-Jost-Bold mb-6">Select Mode</Text>
      <TouchableOpacity
        className="bg-blue-600 rounded-lg px-8 py-3 mb-4"
        onPress={() => {
          // Save mode (e.g., update user context or AsyncStorage)
          // Then navigate to contractor stack
          navigation.replace('(root)/contractor')
        }}
      >
        <Text className="text-white font-Jost-Medium">Contractor</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-secondary rounded-lg px-8 py-3"
        onPress={() => {
          navigation.replace('(root)/customer')
        }}
      >
        <Text className="text-white font-Jost-Medium">Customer</Text>
      </TouchableOpacity>
    </View>
  )
}
