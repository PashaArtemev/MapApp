import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка маркера при изменении id или markers
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
          // Обновляем список маркеров после добавления изображения
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

  // app/marker/[id].tsx - добавьте отладочные console.log
  const handleSave = async () => {
    if (title.trim() === "") {
      Alert.alert("Ошибка", "Название не может быть пустым");
      return;
    }

    console.log("Saving marker:", { id: marker.id, title, description });

    try {
      const result = await updateMarker(marker.id, {
        title: title.trim(),
        description: description.trim(),
      });

      console.log("Update result:", result);

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
