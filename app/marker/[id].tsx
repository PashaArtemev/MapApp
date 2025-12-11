import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ImageList from "../../components/ImageList";
import { useMarkers } from "../../types";

export default function MarkerDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { markers, updateMarker, deleteMarker, addImage, refreshMarkers } =
    useMarkers();

  const [marker, setMarker] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationRadius, setNotificationRadius] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка маркера
  useEffect(() => {
    loadMarker();
  }, [id, markers]);

  const loadMarker = () => {
    try {
      setIsLoading(true);
      const foundMarker = markers.find((m: any) => m.id === id);
      if (foundMarker) {
        setMarker(foundMarker);
        setTitle(foundMarker.title);
        setDescription(foundMarker.description || "");
        setNotificationEnabled(foundMarker.notificationEnabled ?? true);
        setNotificationRadius(foundMarker.notificationRadius ?? 100);
      } else {
        setMarker(null);
      }
    } catch (error) {
      console.error("Error loading marker:", error);
      Alert.alert("Ошибка", "Не удалось загрузить данные маркера");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!marker) {
      Alert.alert("Ошибка", "Маркер не найден");
      return;
    }

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Ошибка",
          "Разрешение на доступ к галерее необходимо для добавления фото"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const imageUri = result.assets[0].uri;

        try {
          await addImage(marker.id, imageUri);
          await refreshMarkers();
          Alert.alert("Успех", "Изображение добавлено");
        } catch (error) {
          console.error("Error adding image:", error);
          Alert.alert("Ошибка", "Не удалось добавить изображение");
        }
      }
    } catch (error) {
      console.error("Ошибка при выборе изображения:", error);
      Alert.alert("Ошибка", "Не удалось выбрать изображение");
    }
  };

  const handleSave = async () => {
    if (title.trim() === "") {
      Alert.alert("Ошибка", "Название не может быть пустым");
      return;
    }

    try {
      await updateMarker(marker.id, {
        title: title.trim(),
        description: description.trim(),
        notificationEnabled,
        notificationRadius,
      });

      setIsEditing(false);
      Alert.alert("Успех", "Изменения сохранены");
    } catch (error) {
      console.error("Error updating marker:", error);
      Alert.alert("Ошибка", "Не удалось сохранить изменения");
    }
  };

  const handleCancel = () => {
    setTitle(marker.title);
    setDescription(marker.description || "");
    setNotificationEnabled(marker.notificationEnabled ?? true);
    setNotificationRadius(marker.notificationRadius ?? 100);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    Alert.alert(
      "Удалить маркер",
      `Вы уверены, что хотите удалить "${marker.title}"?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMarker(marker.id);
              router.back();
            } catch (error) {
              console.error("Error deleting marker:", error);
              Alert.alert("Ошибка", "Не удалось удалить маркер");
            }
          },
        },
      ]
    );
  };

  const handleRadiusChange = (value: number) => {
    if (value >= 10 && value <= 500) {
      setNotificationRadius(value);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!marker) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Маркер не найден</Text>
        <Text style={styles.subtitle}>ID: {id}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Назад к карте</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Введите название"
              placeholderTextColor="#999"
              autoFocus
            />
          ) : (
            <Text style={styles.title}>{marker.title}</Text>
          )}
          <Text style={styles.subtitle}>ID: {marker.id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Координаты</Text>
          <View style={styles.coordinateContainer}>
            <Text style={styles.coordinateText}>
              Широта: {marker.coordinate.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinateText}>
              Долгота: {marker.coordinate.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          {isEditing ? (
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Введите описание"
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.description}>
              {marker.description || "Описание отсутствует"}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Уведомления</Text>
          
          {isEditing ? (
            <View style={styles.notificationEditContainer}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Уведомлять о приближении</Text>
                <Switch
                  value={notificationEnabled}
                  onValueChange={setNotificationEnabled}
                  trackColor={{ false: "#767577", true: "#34C759" }}
                />
              </View>
              
              {notificationEnabled && (
                <View style={styles.radiusContainer}>
                  <Text style={styles.radiusLabel}>
                    Радиус уведомления: {notificationRadius} м
                  </Text>
                  
                  <View style={styles.radiusButtons}>
                    <TouchableOpacity 
                      style={[styles.radiusButton, notificationRadius === 50 && styles.radiusButtonActive]}
                      onPress={() => handleRadiusChange(50)}
                    >
                      <Text style={[styles.radiusButtonText, notificationRadius === 50 && styles.radiusButtonTextActive]}>
                        50 м
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.radiusButton, notificationRadius === 100 && styles.radiusButtonActive]}
                      onPress={() => handleRadiusChange(100)}
                    >
                      <Text style={[styles.radiusButtonText, notificationRadius === 100 && styles.radiusButtonTextActive]}>
                        100 м
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.radiusButton, notificationRadius === 200 && styles.radiusButtonActive]}
                      onPress={() => handleRadiusChange(200)}
                    >
                      <Text style={[styles.radiusButtonText, notificationRadius === 200 && styles.radiusButtonTextActive]}>
                        200 м
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.radiusButton, notificationRadius === 500 && styles.radiusButtonActive]}
                      onPress={() => handleRadiusChange(500)}
                    >
                      <Text style={[styles.radiusButtonText, notificationRadius === 500 && styles.radiusButtonTextActive]}>
                        500 м
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.customRadiusContainer}>
                    <Text style={styles.customRadiusLabel}>Свой радиус:</Text>
                    <View style={styles.customRadiusInputs}>
                      <TouchableOpacity 
                        style={styles.radiusChangeButton}
                        onPress={() => handleRadiusChange(Math.max(10, notificationRadius - 10))}
                      >
                        <Text style={styles.radiusChangeButtonText}>-</Text>
                      </TouchableOpacity>
                      
                      <TextInput
                        style={styles.radiusInput}
                        value={notificationRadius.toString()}
                        onChangeText={(text) => {
                          const num = parseInt(text);
                          if (!isNaN(num) && num >= 10 && num <= 500) {
                            setNotificationRadius(num);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={3}
                      />
                      
                      <TouchableOpacity 
                        style={styles.radiusChangeButton}
                        onPress={() => handleRadiusChange(Math.min(500, notificationRadius + 10))}
                      >
                        <Text style={styles.radiusChangeButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.radiusHint}>От 10 до 500 метров</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.notificationViewContainer}>
              <Text style={styles.notificationText}>
                Уведомления: <Text style={marker.notificationEnabled ? styles.enabledText : styles.disabledText}>
                  {marker.notificationEnabled ? "Включены" : "Выключены"}
                </Text>
              </Text>
              {marker.notificationEnabled && (
                <Text style={styles.notificationText}>
                  Радиус: <Text style={styles.radiusValue}>{marker.notificationRadius} метров</Text>
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ImageList markerId={marker.id} onAddImage={handleAddImage} />
        </View>

        <View style={styles.actionsContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Сохранить</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.buttonText}>Отмена</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Редактировать</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>Удалить маркер</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  coordinateContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  coordinateText: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
  descriptionInput: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    minHeight: 120,
    textAlignVertical: "top",
  },
  notificationEditContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: '500',
  },
  radiusContainer: {
    marginTop: 10,
  },
  radiusLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: '500',
    marginBottom: 15,
  },
  radiusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  radiusButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#34C759',
  },
  radiusButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  radiusButtonTextActive: {
    color: '#fff',
  },
  customRadiusContainer: {
    marginTop: 10,
  },
  customRadiusLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  customRadiusInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  radiusChangeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusChangeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  radiusInput: {
    width: 80,
    height: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 15,
    color: '#333',
  },
  radiusHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  notificationViewContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  notificationText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  enabledText: {
    color: "#34C759",
    fontWeight: '600',
  },
  disabledText: {
    color: "#FF3B30",
    fontWeight: '600',
  },
  radiusValue: {
    color: "#007AFF",
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#34C759",
  },
  saveButton: {
    backgroundColor: "#34C759",
  },
  cancelButton: {
    backgroundColor: "#FF9500",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    margin: 20,
    color: "#FF3B30",
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    margin: 20,
    color: "#666",
  },
});