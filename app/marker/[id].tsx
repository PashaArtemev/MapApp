import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { markerStore } from "../../types";

export default function MarkerDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const marker = markerStore.findById(id as string);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(marker?.title || "");
  const [description, setDescription] = useState(marker?.description || "");
  const [refreshKey, setRefreshKey] = useState(0);

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
        const success = markerStore.addImage(marker.id, imageUri);

        if (success) {
          setRefreshKey((prev) => prev + 1) // Костыль чтобы не использовать props;
          Alert.alert("Успех", "Изображение добавлено");
        } else {
          Alert.alert("Ошибка", "Не удалось добавить изображение");
        }
      }
    } catch (error) {
      console.error("Ошибка при выборе изображения:", error);
      Alert.alert("Ошибка", "Не удалось выбрать изображение");
    }
  };

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

  const handleSave = () => {
    if (title.trim() === "") {
      Alert.alert("Ошибка", "Название не может быть пустым");
      return;
    }

    markerStore.update(marker.id, {
      title: title.trim(),
      description: description.trim(),
    });

    setIsEditing(false);
    Alert.alert("Успех", "Изменения сохранены");
  };

  const handleCancel = () => {
    setTitle(marker.title);
    setDescription(marker.description);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Удалить маркер",
      `Вы уверены, что хотите удалить "${marker.title}"?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            markerStore.delete(marker.id);
            router.back();
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Введите название"
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
              multiline
              numberOfLines={4}
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
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
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
    marginBottom: 10,
  },
  coordinateContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  coordinateText: {
    fontSize: 14,
    color: "#495057",
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
    minHeight: 100,
    textAlignVertical: "top",
  },
  actionsContainer: {
    padding: 20,
    gap: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
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
  },
});
