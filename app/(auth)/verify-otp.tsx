// screens/VerifyOTP.tsx
import { useState } from 'react'
import { View, Text } from 'react-native'
import InputField from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function VerifyOTP({ route, navigation }) {
  const { email } = route.params
  const [otp, setOTP] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onVerify = async () => {
    setLoading(true)
    try {
      // Use Supabase to verify OTP (for email)
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'signup', // or 'sms' for phone, depending on setup
      })
      if (error) throw error
      // If verification succeeds, user is logged in
      navigation.replace('RoleSelect')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 justify-center px-6">
      <Text className="text-xl font-Jost-Bold text-center mb-4">Verify Code</Text>
      <InputField
        label="Enter OTP"
        placeholder="123456"
        value={otp}
        onChangeText={setOTP}
        keyboardType="numeric"
      />
      {error && <Text className="text-red-600 mb-2">{error}</Text>}
      <Button
        title={loading ? "Verifying..." : "Verify"}
        onPress={onVerify}
        disabled={loading}
        className="w-full"
      />
    </View>
  )
}
