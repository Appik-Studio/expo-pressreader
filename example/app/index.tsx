import ExpoPressReader from '@appik-studio/expo-pressreader'
import {useState} from 'react'
import {Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native'
import styles from './styles'

const ARTICLE_IDS = ["281651080992599", "281505052102991", "281852944455775", "281736980338521"];

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);



  const authorizeWithToken = async () => {
    const demoToken = "demo_auth_token_12345";

    try {
      await ExpoPressReader.instance.account.authorize(demoToken);
      Alert.alert("Success", "Authorization successful");
    } catch (error) {
      Alert.alert("Authorization Error", `Failed to authorize: ${error}`);
    }
  };

  const openArticle = async (articleId: string) => {
    setIsLoading(true);
    try {
      await authorizeWithToken();
      await ExpoPressReader.instance.openArticle(articleId);
      Alert.alert("Success", `Article ${articleId} opened successfully`);
    } catch (error) {
      Alert.alert("Error", `Failed to open article: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openReader = async () => {
    try {
      ExpoPressReader.instance.open();
    } catch (error) {
      Alert.alert("Error", `Failed to open PressReader: ${error}`);
    }
  };

  const dismissReader = async () => {
    try {
      ExpoPressReader.instance.dismiss();
      Alert.alert("Success", "PressReader dismissed");
    } catch (error) {
      Alert.alert("Error", `Failed to dismiss PressReader: ${error}`);
    }
  };

  const getLogs = async () => {
    try {
      const result = await ExpoPressReader.instance.getLogs();
      Alert.alert(
        "Logs Uploaded",
        `Link: ${result.linkToUploadedLogs}\n\nAdditional Info: ${result.additionalInfo}`
      );
    } catch (error) {
      Alert.alert("Error", `Failed to get logs: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>PressReader SDK</Text>
        <Text style={styles.subtitle}>Demo Application</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          <Text style={styles.description}>
            Demo authentication will be performed automatically when opening articles.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={authorizeWithToken}
          >
            <Text style={[styles.buttonText, styles.tertiaryButtonText]}>
              Authorize with Demo Token
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Articles</Text>
          <Text style={styles.description}>
            Open articles using real article IDs from the PressReader demo.
          </Text>

          <View style={styles.articleGrid}>
            {ARTICLE_IDS.map((articleId, index) => (
              <TouchableOpacity
                key={articleId}
                style={[styles.button, styles.articleButton]}
                onPress={() => openArticle(articleId)}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, styles.articleButtonText]}>
                  Article {index + 1}
                </Text>
                <Text style={styles.articleId}>ID: {articleId}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SDK Controls</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={openReader}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Open PressReader
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={dismissReader}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Dismiss PressReader
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.tertiaryButton]}
              onPress={getLogs}
            >
              <Text style={[styles.buttonText, styles.tertiaryButtonText]}>
                Get Logs
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This demo uses real article IDs from the PressReader iOS SDK demo.
            For production use, configure your service name and obtain valid auth tokens.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomePage;
