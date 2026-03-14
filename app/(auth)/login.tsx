import { authApi } from "@/src/apis/auth.api";
import { LoginFormData, loginSchema } from "@/src/shared/schemas/auth.schema";
import { useAuthStore } from "@/src/store/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const loginAction = useAuthStore((state) => state.login);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(data);

      await loginAction(
        response.user,
        response.accessToken,
        response.refreshToken,
      );

      Toast.show({ type: "success", text1: "Đăng nhập thành công" });
    } catch (error: any) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại",
        text2: error.message || "Sai thông tin đăng nhập",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        MMA Project Supply Chain
      </Text>

      {/* Đã sửa tên trường và thêm keyboardType="email-address" */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Email"
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.email}
            style={styles.input}
          />
        )}
      />
      {errors.email && (
        <Text style={{ color: theme.colors.error }}>
          {errors.email.message}
        </Text>
      )}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Mật khẩu"
            mode="outlined"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.password}
            style={styles.input}
          />
        )}
      />
      {errors.password && (
        <Text style={{ color: theme.colors.error }}>
          {errors.password.message}
        </Text>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        Đăng nhập
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    textAlign: "center",
    marginBottom: 40,
    fontWeight: "bold",
    color: "#D32F2F",
  },
  input: { marginBottom: 10 },
  button: { marginTop: 20, paddingVertical: 5 },
});
