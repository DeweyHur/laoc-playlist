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
  MessageBar,
  MessageBarBody,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableSelectionCell,
  Input,
} from '@fluentui/react-components'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '800px',
    margin: '0 auto',
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
  },
  table: {
    width: '100%',
    marginTop: tokens.spacingVerticalM,
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
  instrumentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
})

const INSTRUMENTS = ['Singer', 'Piano', 'Guitar', 'Bass', 'Drum', 'Violin']

function ProfilePage() {
  const styles = useStyles()
  const { user, refreshUserProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [selectedInstruments, setSelectedInstruments] = useState([])
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setSelectedInstruments(data.instruments || [])
      setNickname(data.nickname || '')
    } catch (error) {
      console.error('Error fetching profile:', error.message)
      setError('Failed to load profile. Please try again later.')
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
    setError(null)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          instruments: selectedInstruments,
          nickname: nickname.trim() || 'Anonymous'
        })
        .eq('id', user.id)

      if (error) throw error

      // Refresh the profile in AuthContext
      await refreshUserProfile()
      // Also refresh local profile data
      await fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error.message)
      setError('Failed to save changes. Please try again later.')
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
      {error && (
        <MessageBar intent="error" className={styles.errorMessage}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      
      <div className={styles.section}>
        <Title3>Profile Information</Title3>
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Field</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>{user.email}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Nickname</TableCell>
              <TableCell>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>{user.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Created At</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className={styles.section}>
        <Title3>Instruments</Title3>
        <Text>Select the instruments you can play:</Text>
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Instrument</TableHeaderCell>
              <TableHeaderCell>Selected</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INSTRUMENTS.map((instrument) => (
              <TableRow key={instrument}>
                <TableCell>{instrument}</TableCell>
                <TableCell>
                  <div className={styles.instrumentCell}>
                    <Checkbox
                      id={instrument}
                      checked={selectedInstruments.includes(instrument)}
                      onChange={() => handleInstrumentChange(instrument)}
                    />
                    <Label htmlFor={instrument}>{instrument}</Label>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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