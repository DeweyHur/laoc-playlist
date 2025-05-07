import { useState, useEffect } from 'react'
import {
    Title3,
    Text,
    makeStyles,
    tokens,
    Button,
    Spinner,
    MessageBar,
    MessageBarBody,
    Card,
    CardHeader,
    CardPreview,
    CardFooter,
    Input,
    Textarea,
    Dropdown,
    Option,
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Label,
    Combobox,
    Listbox,
    Option as ComboboxOption,
} from '@fluentui/react-components'
import {
    EditRegular,
    AddRegular,
    SaveRegular,
    DismissRegular,
    ListRegular,
    VideoRegular,
    PersonRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { extractVideoId } from '../lib/youtubeUtils'
import LocationAutocomplete from '../components/LocationAutocomplete'

const useStyles = makeStyles({
    container: {
        padding: tokens.spacingHorizontalL,
        maxWidth: '1200px',
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
    },
    videoList: {
        marginTop: tokens.spacingVerticalL,
    },
    videoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        padding: tokens.spacingVerticalM,
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    },
    roleList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalS,
    },
    roleTag: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: tokens.borderRadiusMedium,
    },
})

function RegularPerformanceAdminPage() {
    const styles = useStyles()
    const navigate = useNavigate()
    const { isAdmin, isDevelopment, userProfile } = useAuth()
    const [performances, setPerformances] = useState([])
    const [locations, setLocations] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editedPerformance, setEditedPerformance] = useState(null)
    const [selectedLocation, setSelectedLocation] = useState(null)

    useEffect(() => {
        if (!loading && !isAdmin() && !isDevelopment) {
            navigate('/regular-performance')
        }
    }, [loading, isAdmin, isDevelopment, navigate])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch performances
            const { data: performancesData, error: performancesError } = await supabase
                .from('regular_performances')
                .select(`
                    *,
                    location:locations(name),
                    participants:performance_participants_with_users(*)
                `)
                .order('date', { ascending: false })

            if (performancesError) throw performancesError

            // Fetch locations
            const { data: locationsData, error: locationsError } = await supabase
                .from('locations')
                .select('*')
                .order('name')

            if (locationsError) throw locationsError

            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('user_profiles_with_email')
                .select('*')
                .order('email')

            if (usersError) throw usersError

            setPerformances(performancesData || [])
            setLocations(locationsData || [])
            setUsers(usersData || [])
        } catch (error) {
            console.error('Error fetching data:', error.message)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (performance) => {
        setEditedPerformance({
            id: performance.id,
            title: performance.title,
            description: performance.description || '',
            date: performance.date,
            location_id: performance.location_id || '',
            participants: performance.participants?.map(p => p.user.id) || [],
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        try {
            let data, error;

            if (editedPerformance.id) {
                // Update existing performance
                const result = await supabase
                    .from('regular_performances')
                    .update({
                        title: editedPerformance.title,
                        description: editedPerformance.description,
                        date: editedPerformance.date,
                        location_id: editedPerformance.location_id,
                    })
                    .eq('id', editedPerformance.id)
                    .select()
                    .single();
                data = result.data;
                error = result.error;

                if (error) throw error;

                // Update participants
                const { error: participantsError } = await supabase
                    .from('performance_participants')
                    .delete()
                    .eq('performance_id', editedPerformance.id);

                if (participantsError) throw participantsError;

                if (editedPerformance.participants.length > 0) {
                    const { error: insertError } = await supabase
                        .from('performance_participants')
                        .insert(
                            editedPerformance.participants.map(userId => ({
                                performance_id: editedPerformance.id,
                                user_id: userId,
                            }))
                        );

                    if (insertError) throw insertError;
                }
            } else {
                // Create new performance
                const result = await supabase
                    .from('regular_performances')
                    .insert({
                        title: editedPerformance.title,
                        description: editedPerformance.description,
                        date: editedPerformance.date,
                        location_id: editedPerformance.location_id,
                    })
                    .select()
                    .single();
                data = result.data;
                error = result.error;

                if (error) throw error;

                // Add participants
                if (editedPerformance.participants.length > 0) {
                    const { error: insertError } = await supabase
                        .from('performance_participants')
                        .insert(
                            editedPerformance.participants.map(userId => ({
                                performance_id: data.id,
                                user_id: userId,
                            }))
                        );

                    if (insertError) throw insertError;
                }
            }

            await fetchData();
            setIsEditing(false)
            setEditedPerformance(null)
        } catch (error) {
            console.error('Error updating performance:', error.message)
            setError(error.message)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEditedPerformance(null)
    }

    const handleOpenVideoDialog = (performance) => {
        navigate(`/regular-performance/admin/${performance.id}/videos`)
    }

    const handleLocationSelect = async (location) => {
        try {
            // Check if location already exists
            const { data: existingLocation } = await supabase
                .from('locations')
                .select('*')
                .eq('place_id', location.place_id)
                .single()

            if (existingLocation) {
                setSelectedLocation(existingLocation)
                setEditedPerformance(prev => ({
                    ...prev,
                    location_id: existingLocation.id
                }))
                return
            }

            // Create new location
            const { data: newLocation, error } = await supabase
                .from('locations')
                .insert({
                    name: location.name,
                    place_id: location.place_id,
                    address: location.address,
                    lat: location.lat,
                    lng: location.lng
                })
                .select()
                .single()

            if (error) throw error

            setSelectedLocation(newLocation)
            setEditedPerformance(prev => ({
                ...prev,
                location_id: newLocation.id
            }))
        } catch (error) {
            console.error('Error saving location:', error.message)
            setError(error.message)
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
                <Title3>정모 플레이리스트 관리</Title3>
                {!isEditing && (
                    <Button
                        appearance="primary"
                        icon={<AddRegular />}
                        onClick={() => {
                            setEditedPerformance({
                                title: '',
                                description: '',
                                date: new Date().toISOString().split('T')[0],
                                location_id: '',
                                participants: [],
                            })
                            setIsEditing(true)
                        }}
                    >
                        Add Performance
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className={styles.form}>
                    <Input
                        value={editedPerformance.title}
                        onChange={(e) => setEditedPerformance(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Performance title"
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    <Textarea
                        value={editedPerformance.description}
                        onChange={(e) => setEditedPerformance(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Performance description"
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    <Input
                        type="date"
                        value={editedPerformance.date}
                        onChange={(e) => setEditedPerformance(prev => ({ ...prev, date: e.target.value }))}
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    <LocationAutocomplete
                        value={selectedLocation?.name || ''}
                        onChange={(value) => setSelectedLocation(prev => ({ ...prev, name: value }))}
                        onSelect={handleLocationSelect}
                    />
                    <Label>Participants</Label>
                    <Combobox
                        multiselect
                        value={editedPerformance.participants.map(id => users.find(u => u.id === id)?.nickname || '')}
                        onOptionSelect={(e, data) => {
                            const userId = data.optionValue
                            setEditedPerformance(prev => ({
                                ...prev,
                                participants: prev.participants.includes(userId)
                                    ? prev.participants.filter(id => id !== userId)
                                    : [...prev.participants, userId],
                            }))
                        }}
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    >
                        <Listbox>
                            {users.map(user => (
                                <ComboboxOption key={user.id} value={user.id}>
                                    {user.nickname || 'Anonymous'}
                                </ComboboxOption>
                            ))}
                        </Listbox>
                    </Combobox>
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                        <Button
                            appearance="primary"
                            icon={<SaveRegular />}
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                        <Button
                            appearance="secondary"
                            icon={<DismissRegular />}
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className={styles.grid}>
                    {performances.map((performance) => (
                        <Card key={performance.id} className={styles.videoCard}>
                            <CardPreview>
                                <div className={styles.thumbnail} style={{ backgroundColor: tokens.colorNeutralBackground3 }}>
                                    <ListRegular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
                                </div>
                            </CardPreview>
                            <div className={styles.videoInfo}>
                                <Title3>{performance.title}</Title3>
                                <Text className={styles.channelInfo}>
                                    {new Date(performance.date).toLocaleDateString()} - {performance.location?.name}
                                </Text>
                                {performance.description && (
                                    <Text className={styles.description}>{performance.description}</Text>
                                )}
                                {performance.participants?.length > 0 && (
                                    <Text className={styles.channelInfo}>
                                        Participants: {performance.participants.map(p => p.nickname || 'Anonymous').join(', ')}
                                    </Text>
                                )}
                            </div>
                            <CardFooter>
                                <Button
                                    appearance="primary"
                                    icon={<EditRegular />}
                                    onClick={() => handleEdit(performance)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    appearance="secondary"
                                    icon={<VideoRegular />}
                                    onClick={() => handleOpenVideoDialog(performance)}
                                >
                                    Manage Videos
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default RegularPerformanceAdminPage 