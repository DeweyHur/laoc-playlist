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
  FluentProvider,
  webDarkTheme,
} from '@fluentui/react-components'
import { 
  PersonRegular,
  MoreHorizontalRegular,
  HomeRegular,
  SignOutRegular,
  ListRegular,
  ChatRegular
} from '@fluentui/react-icons'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import ChatDrawer from './ChatDrawer'

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
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

function Layout() {
  const styles = useStyles()
  const navigate = useNavigate()
  const { user, handleLogout, handleKakaoLogin } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false)

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
            onClick={handleLogout}
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
            icon={<ChatRegular />}
            onClick={() => setIsChatOpen(true)}
          >
            채팅
          </MenuItem>
          <MenuItem 
            icon={<PersonRegular />}
            onClick={() => navigate('/profile')}
          >
            프로필
          </MenuItem>
          <MenuItem 
            icon={<SignOutRegular />} 
            onClick={handleLogout}
          >
            로그아웃
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )

  const renderDesktopMenu = () => (
    <div className={styles.desktopMenu}>
      <Button 
        appearance="subtle" 
        icon={<HomeRegular />}
        onClick={() => navigate('/')}
      >
        홈
      </Button>
      <Button 
        appearance="subtle" 
        icon={<ListRegular />}
        onClick={() => navigate('/playlist')}
      >
        플레이리스트
      </Button>
      <Button 
        appearance="subtle" 
        icon={<ChatRegular />}
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        채팅
      </Button>
    </div>
  )

  return (
    <FluentProvider theme={webDarkTheme}>
      <div className={styles.root}>
        <header className={styles.header}>
          <Title3>🎵 밴드방 유튜브 플레이리스트</Title3>
          <div className={styles.navContainer}>
            {renderDesktopMenu()}
            {user ? renderProfileMenu() : (
              <Button appearance="primary" onClick={handleKakaoLogin}>
                카카오 로그인
              </Button>
            )}
            <div className={styles.mobileMenu}>
              {renderMobileMenu()}
            </div>
          </div>
        </header>
        {user ? (
          <>
            <main className={styles.main}>
              <Outlet />
            </main>
            <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
          </>
        ) : null}
      </div>
    </FluentProvider>
  )
}

export default Layout 