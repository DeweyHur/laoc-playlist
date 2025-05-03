import { useState, useEffect } from 'react'
import {
  Title3,
  Text,
  makeStyles,
  tokens,
  Button,
  Checkbox,
  Label,
  Spinner,
} from '@fluentui/react-components'
import { supabase } from '../lib/supabase'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '600px',
    margin: '0 auto',
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
  },
  instrumentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalS,
  },
})

const INSTRUMENTS = ['Singer', 'Piano', 'Guitar', 'Bass', 'Drum', 'Violin']

function ProfilePage({ user }) {
  const styles = useStyles()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [selectedInstruments, setSelectedInstruments] = useState([])

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setSelectedInstruments(data.instruments || [])
    } catch (error) {
      console.error('Error fetching profile:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInstrumentChange = (instrument) => {
    setSelectedInstruments(prev => {
      if (prev.includes(instrument)) {
        return prev.filter(i => i !== instrument)
      } else {
        return [...prev, instrument]
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ instruments: selectedInstruments })
        .eq('id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating profile:', error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner label="Loading profile..." />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <Title3>Profile</Title3>
        <Text>Email: {user.email}</Text>
      </div>

      <div className={styles.section}>
        <Title3>Instruments</Title3>
        <Text>Select the instruments you can play:</Text>
        <div className={styles.instrumentsGrid}>
          {INSTRUMENTS.map((instrument) => (
            <div key={instrument}>
              <Checkbox
                id={instrument}
                checked={selectedInstruments.includes(instrument)}
                onChange={() => handleInstrumentChange(instrument)}
                label={instrument}
              />
            </div>
          ))}
        </div>
        <Button
          appearance="primary"
          onClick={handleSave}
          disabled={saving}
          style={{ marginTop: tokens.spacingVerticalM }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

export default ProfilePage 