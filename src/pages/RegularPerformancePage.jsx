import { useState, useEffect } from 'react'
import {
  Title3,
  Text,
  makeStyles,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  Card,
  CardPreview,
} from '@fluentui/react-components'
import { supabase } from '../lib/supabase'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: tokens.spacingVerticalL,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  videoCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusSmall,
  },
  videoInfo: {
    padding: tokens.spacingVerticalM,
  },
  channelInfo: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
  description: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
  },
})

function RegularPerformancePage() {
  const styles = useStyles()
  const [performances, setPerformances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPerformances()
  }, [])

  const fetchPerformances = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('regular_performances')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setPerformances(data || [])
    } catch (error) {
      console.error('Error fetching performances:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading performances..." />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {error && (
        <MessageBar intent="error" className={styles.errorMessage}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.header}>
        <Title3>정모 공연</Title3>
      </div>

      <div className={styles.grid}>
        {performances.map((performance) => (
          <Card key={performance.id} className={styles.videoCard}>
            <CardPreview>
              <img
                src={performance.youtube_url ? `https://img.youtube.com/vi/${performance.youtube_url.split('v=')[1]}/maxresdefault.jpg` : 'https://via.placeholder.com/320x180'}
                alt={performance.title}
                className={styles.thumbnail}
              />
            </CardPreview>
            <div className={styles.videoInfo}>
              <Title3>{performance.title}</Title3>
              <Text className={styles.channelInfo}>
                {new Date(performance.date).toLocaleDateString()} - {performance.location}
              </Text>
              {performance.description && (
                <Text className={styles.description}>{performance.description}</Text>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default RegularPerformancePage 