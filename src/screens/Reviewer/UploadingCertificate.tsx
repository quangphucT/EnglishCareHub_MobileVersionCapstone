import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useAuthRefresh } from '../../navigation/AppNavigator';
import { useLogout } from '../../hooks/useAuth';

const UploadingCertificate = () => {
    const { refreshAuth } = useAuthRefresh();
    const logoutMutation = useLogout();
   const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await refreshAuth();
      },
    });
  };
  return (
    <View className='flex items-center justify-center'>
      <Text>Uploading Certificate</Text>
       <View>
              <TouchableOpacity
                onPress={handleLogout}
                className="mt-6 bg-purple-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-black font-semibold">Quay lại</Text>
              </TouchableOpacity>
            </View> 
    </View>
  )
}

export default UploadingCertificate
