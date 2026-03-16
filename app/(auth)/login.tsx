import { authApi } from "@/src/apis/auth.api";
import { LoginFormData, loginSchema } from "@/src/shared/schemas/auth.schema";
import { useAuthStore } from "@/src/store/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Button, Text, TextInput, useTheme, Surface, Icon } from "react-native-paper";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
        {
          id: response.userId,
          email: response.email,
          username: response.username,
          role: response.role,
          storeId: response.storeId,
        },
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
      <StatusBar style="light" />
      
      {/* Top Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Icon source="truck-delivery-outline" size={48} color="#fff" />
        </View>
        <Text style={styles.title}>Chuỗi Cung Ứng</Text>
        <Text style={styles.subtitle}>Quản lý đồng bộ và thông minh</Text>
      </View>

      {/* Form Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Surface style={styles.formCard} elevation={4}>
            <Text style={styles.welcomeText}>Xin chào,</Text>
            <Text style={styles.instructionText}>Vui lòng đăng nhập để tiếp tục</Text>

            <View style={styles.inputGroup}>
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
                    left={<TextInput.Icon icon="email-outline" color="#E65100" />}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#E65100"
                    style={styles.input}
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Mật khẩu"
                    mode="outlined"
                    secureTextEntry={!isPasswordVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.password}
                    left={<TextInput.Icon icon="lock-outline" color="#E65100" />}
                    right={
                      <TextInput.Icon 
                        icon={isPasswordVisible ? "eye-off" : "eye"} 
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        color="#888"
                      />
                    }
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#E65100"
                    style={styles.input}
                  />
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Đăng nhập hệ thống
            </Button>
            
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>
                Hệ thống Quản lý Bếp Trung Tâm và Cửa hàng Franchise
              </Text>
            </View>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E65100", // Deep orange base
  },
  headerContainer: {
    height: height * 0.35,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 6,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  instructionText: {
    fontSize: 15,
    color: "#666",
    marginTop: 8,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: "#E65100",
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    borderRadius: 16,
    backgroundColor: "#E65100",
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footerInfo: {
    marginTop: "auto",
    paddingTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
});
