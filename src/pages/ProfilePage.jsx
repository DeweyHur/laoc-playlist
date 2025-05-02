import {
  Title3,
  Text,
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Avatar,
} from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '800px',
    margin: '0 auto',
  },
  profileCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
})

function ProfilePage({ user }) {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Card className={styles.profileCard}>
        <CardHeader>
          <div className={styles.profileHeader}>
            <Avatar 
              name={user?.user_metadata?.name || 'User'} 
              size={64}
            />
            <div className={styles.profileInfo}>
              <Title3>{user?.user_metadata?.name || 'User'}</Title3>
              <Text>{user?.email}</Text>
            </div>
          </div>
        </CardHeader>
        <CardPreview>
          <Text>Profile information and settings will be added here.</Text>
        </CardPreview>
      </Card>
    </div>
  )
}

export default ProfilePage 