import React from "react";
import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { markerStore } from "../types";

interface ImageListProps {
  markerId: string;
  onAddImage: () => void;
}

export default function ImageList({ markerId, onAddImage }: ImageListProps) {
  const [images, setImages] = React.useState<string[]>([]);

  // Загружаем изображения при монтировании и при изменении markerId
  React.useEffect(() => {
    loadImages();
  }, [markerId]);

  const loadImages = () => {
    const markerImages = markerStore.getImages(markerId);
    setImages(markerImages);
  };

  const handleDeleteImage = (imageUri: string) => {
    Alert.alert(
      "Удалить изображение",
      "Вы уверены, что хотите удалить это изображение?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            const success = markerStore.removeImage(markerId, imageUri);
            if (success) {
              loadImages(); // Перезагружаем список
              Alert.alert("Успех", "Изображение удалено");
            } else {
              Alert.alert("Ошибка", "Не удалось удалить изображение");
            }
          }
        }
      ]
    );
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.image} />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteImage(item)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Изображения ({images.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddImage}>
          <Text style={styles.addButtonText}>+ Добавить</Text>
        </TouchableOpacity>
      </View>

      {images.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Нет изображений</Text>
          <Text style={styles.emptyStateSubtext}>
            Нажмите "Добавить" чтобы прикрепить фото
          </Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagesList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  imagesList: {
    paddingHorizontal: 15,
  },
  imageContainer: {
    position: "relative",
    marginRight: 10,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  deleteButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});