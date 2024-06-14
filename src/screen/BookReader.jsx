import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { getBookDetail } from '../api/book'
import { useFocusEffect } from '@react-navigation/native'
import * as Speech from 'expo-speech'

const BookReaderScreen = ({ route }) => {
  const book = route.params
  const [currentChapterIndex, setCurrentChapterIndex] = useState(1)
  const [bookChapterContent, setBookChapterContent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const [sentences, setSentences] = useState([])
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [playbackState, setPlaybackState] = useState('stopped')
  const [speechRate, setSpeechRate] = useState(1.0)
  const [volume, setVolume] = useState(1.0)

  const scrollViewRef = useRef(null)
  const sentenceRefs = useRef([])

  useEffect(() => {
    const fetchChapterContent = async () => {
      try {
        const params = {
          device_id: '1',
          book_id: `${book.id}`,
          chapter_id: `${currentChapterIndex}`
        }
        const res = await getBookDetail(params)
        setBookChapterContent(res.content)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching chapter content:', error)
      }
    }

    fetchChapterContent()
  }, [currentChapterIndex, book.id])

  useEffect(() => {
    if (bookChapterContent) {
      const newSentences = bookChapterContent
        .split(/[.?!;]/)
        .filter(sentence => sentence.trim() !== '')
      setSentences(newSentences)
      setCurrentSentenceIndex(0)
      setPlaybackState('stopped')
      stopSpeech()
    }
  }, [bookChapterContent, currentChapterIndex])

  const speak = useCallback(
    sentence => {
      Speech.speak(sentence, {
        language: 'vi',
        rate: speechRate,
        volume: volume,
        onDone: () => {
        //   console.log(currentSentenceIndex, sentences.length)
          if (currentSentenceIndex < sentences.length - 1) {
            setCurrentSentenceIndex(prevIndex => {
              // speakCurrentSentence()
              speak(sentences[prevIndex + 1])
              return prevIndex + 1
            })
            // speakCurrentSentence()
          } else {
            setPlaybackState('stopped')
          }
        },
        onStopped: () => setPlaybackState('stopped'),
        onError: () => setPlaybackState('stopped')
      })
    },
    [currentChapterIndex, currentSentenceIndex, sentences, speechRate, volume, speakCurrentSentence]
  )

  const speakCurrentSentence = useCallback(() => {
    if (currentSentenceIndex < sentences.length) {
      speak(sentences[currentSentenceIndex])
      setPlaybackState('playing')
    }
  }, [currentChapterIndex, currentSentenceIndex, sentences, speak])

  const pauseSpeech = useCallback(async () => {
    // await Speech.pause()
    await Speech.stop()
    setPlaybackState('paused')
  }, [currentChapterIndex, currentSentenceIndex, sentences, playbackState])

  const resumeSpeech = useCallback(async () => {
    // await Speech.resume()
    speakCurrentSentence()
    setPlaybackState('playing')
  }, [currentChapterIndex, currentSentenceIndex, sentences, playbackState, speakCurrentSentence])

  const stopSpeech = useCallback(async () => {
    await Speech.stop()
    setPlaybackState('stopped')
  }, [])

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeech()
      }
    }, [stopSpeech])
  )

  useEffect(() => {
    if (!isLoading && scrollViewRef.current) {
      sentenceRefs.current.forEach((ref, index) => {
        if (ref) {
          ref.measureLayout(
            scrollViewRef.current,
            (x, y, width, height) => {
              sentenceRefs.current[index].layout = { x, y, width, height }
            },
            error => console.log('Error measuring sentence:', error)
          )
        }
      })
    }
    scrollToCurrentSentence()
  }, [currentChapterIndex, currentSentenceIndex, sentences, isLoading])

  const scrollToCurrentSentence = useCallback(() => {
    if (
      scrollViewRef.current &&
      sentenceRefs.current[currentSentenceIndex]?.layout
    ) {
      scrollViewRef.current.scrollTo({
        y: sentenceRefs.current[currentSentenceIndex].layout.y,
        animated: true
      })
    }
  }, [currentSentenceIndex])

  const toggleDescription = useCallback(() => {
    setShowFullDescription(prevState => !prevState)
  }, [])

  const handleNextChapter = useCallback(() => {
    if (currentChapterIndex < book.chapters.length) {
      setCurrentChapterIndex(prevIndex => prevIndex + 1)
      setIsLoading(true)
    }
  }, [currentChapterIndex, book.chapters.length])

  const handlePreviousChapter = useCallback(() => {
    if (currentChapterIndex > 1) {
      setCurrentChapterIndex(prevIndex => prevIndex - 1)
      setIsLoading(true)
    }
  }, [currentChapterIndex])

  const getProgressPercentage = useCallback(() => {
    return Math.round((currentSentenceIndex / sentences.length) * 100)
  }, [currentSentenceIndex, sentences])

  return (
    <View style={styles.container}>
      <View style={styles.bookInfoContainer}>
        <Image source={{ uri: book.coverImage }} style={styles.coverImage} />
        <View style={styles.bookDetails}>
          <Text numberOfLines={1} ellipsizeMode='tail' style={styles.title}>
            {book.name}
          </Text>
          <Text style={styles.author}>Tác giả: {book.author.name}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={toggleDescription}>
        <Text style={styles.description}>
          {showFullDescription
            ? book.description
            : `${book.description.substring(0, 100)}...`}
          <Text style={styles.seeMoreText}>
            {showFullDescription ? ' Thu gọn' : ' Xem thêm'}
          </Text>
        </Text>
      </TouchableOpacity>
      <Text style={styles.title}>{`Chương ${currentChapterIndex}: `}</Text>
      {isLoading ? (
        <ActivityIndicator size='large' style={styles.loadingIndicator} />
      ) : (
        <View style={styles.content}>
          <ScrollView style={styles.content} ref={scrollViewRef}>
            {sentences.map((sentence, index) => (
              <Text
                key={index}
                ref={ref => (sentenceRefs.current[index] = ref)}
                style={[
                  styles.chapterContent,
                  index === currentSentenceIndex && styles.currentSentence
                ]}
              >
                {sentence}
              </Text>
            ))}
          </ScrollView>
          <Text style={styles.progress}>
            Tiến độ: {getProgressPercentage()}%
          </Text>

          <View style={styles.controlContainer}>
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => {
                  if (currentSentenceIndex > 0) {
                    setCurrentSentenceIndex(prevIndex => prevIndex - 1)
                  }
                }}
                style={styles.controlButton}
              >
                <Icon name='play-back' size={30} color='black' />
              </TouchableOpacity>
              {playbackState === 'playing' ? (
                <TouchableOpacity
                  onPress={pauseSpeech}
                  style={styles.controlButton}
                >
                  <Icon name='pause' size={30} color='black' />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={
                    playbackState === 'stopped'
                      ? speakCurrentSentence
                      : resumeSpeech
                  }
                  style={styles.controlButton}
                >
                  <Icon name='play' size={30} color='black' />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (currentSentenceIndex < sentences.length - 1) {
                    setCurrentSentenceIndex(prevIndex => prevIndex + 1)
                  }
                }}
                style={styles.controlButton}
              >
                <Icon name='play-forward' size={30} color='black' />
              </TouchableOpacity>
            </View>

            <View style={styles.verticalControls}>
              <TouchableOpacity
                onPress={() => adjustVolume(volume + 0.1)}
                style={styles.controlButton}
              >
                <Icon name='volume-high' size={30} color='black' />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => adjustVolume(volume - 0.1)}
                style={styles.controlButton}
              >
                <Icon name='volume-low' size={30} color='black' />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => adjustSpeed(Math.max(0.5, speechRate - 0.1))}
                style={styles.controlButton}
              >
                <Icon name='walk' size={30} color='black' />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => adjustSpeed(1.0)}
                style={styles.controlButton}
              >
                <Icon name='speedometer' size={30} color='black' />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => adjustSpeed(Math.min(2.0, speechRate + 0.1))}
                style={styles.controlButton}
              >
                <Icon name='rocket' size={30} color='black' />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handlePreviousChapter}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Chương trước</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNextChapter} style={styles.button}>
              <Text style={styles.buttonText}>Chương sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  coverImage: {
    width: 100,
    height: 150,
    padding: 5
  },
  bookDetails: {
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  author: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555'
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 20
  },
  seeMoreText: {
    color: '#007BFF'
  },
  content: {
    flex: 1
  },
  chapterContent: {
    fontSize: 18
  },
  currentSentence: {
    fontWeight: 'bold',
    color: '#007BFF'
  },
  progress: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  controlButton: {
    padding: 10
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  loadingIndicator: {
    marginTop: 20
  },
  bookInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  coverImage: {
    width: 80,
    height: 100,
    marginRight: 10
  },
  bookDetails: {
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5
  },
  verticalControls: {
    position: 'absolute',
    right: 0,
    bottom: 200,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: 50
  },
  controlButton: {
    padding: 10
  }
})

export default BookReaderScreen
