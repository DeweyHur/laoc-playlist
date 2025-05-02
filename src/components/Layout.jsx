import { Outlet, useNavigate } from 'react-router-dom'
import {
  Title3,
  Text,
  makeStyles,
  tokens,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
  Avatar,
  TabList,
  Tab,
} from '@fluentui/react-components'
import { 
  PersonRegular,
  MoreHorizontalRegular,
  HomeRegular,
  SignOutRegular,
  ListRegular
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingHorizontalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  navContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  profileMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  mobileMenu: {
    '@media (min-width: 768px)': {
      display: 'none',
    },
  },
  desktopMenu: {
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'flex',
    },
  },
  main: {
    flex: 1,
    backgroundColor: tokens.colorNeutralBackground2,
  },
})

function Layout({ user, onLogout }) {
  const styles = useStyles()
  const navigate = useNavigate()

  const renderProfileMenu = () => (
    <Menu>
      <MenuTrigger>
        <Button appearance="subtle" className={styles.profileMenu}>
          <Avatar 
            name={user?.user_metadata?.name || 'User'} 
            size={32}
          />
          <Text>{user?.user_metadata?.name || 'User'}</Text>
        </Button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem 
            icon={<PersonRegular />}
            onClick={() => navigate('/profile')}
          >
            프로필
          </MenuItem>
          <MenuItem 
            icon={<SignOutRegular />} 
            onClick={onLogout}
          >
            로그아웃
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )

  const renderMobileMenu = () => (
    <Menu>
      <MenuTrigger>
        <Button appearance="subtle" icon={<MoreHorizontalRegular />} />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem 
            icon={<HomeRegular />}
            onClick={() => navigate('/')}
          >
            홈
          </MenuItem>
          <MenuItem 
            icon={<ListRegular />}
            onClick={() => navigate('/playlist')}
          >
            플레이리스트
          </MenuItem>
          <MenuItem 
            icon={<PersonRegular />}
            onClick={() => navigate('/profile')}
          >
            프로필
          </MenuItem>
          <MenuItem 
            icon={<SignOutRegular />} 
            onClick={onLogout}
          >
            로그아웃
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )

  const renderDesktopMenu = () => (
    <TabList
      className={styles.desktopMenu}
      onTabSelect={(e, data) => {
        if (data.value === 'home') navigate('/')
        if (data.value === 'playlist') navigate('/playlist')
      }}
    >
      <Tab value="home" icon={<HomeRegular />}>홈</Tab>
      <Tab value="playlist" icon={<ListRegular />}>플레이리스트</Tab>
    </TabList>
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Title3>🎵 밴드방 유튜브 플레이리스트</Title3>
        <div className={styles.navContainer}>
          {renderDesktopMenu()}
          {renderProfileMenu()}
          <div className={styles.mobileMenu}>
            {renderMobileMenu()}
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout 