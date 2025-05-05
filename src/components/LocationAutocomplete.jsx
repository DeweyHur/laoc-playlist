import { useEffect, useRef, useState } from 'react'
import { Input, Listbox, Option } from '@fluentui/react-components'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
    container: {
        position: 'relative',
    },
    suggestions: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: tokens.colorNeutralBackground1,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow16,
        zIndex: 1000,
        maxHeight: '300px',
        overflowY: 'auto',
    },
    suggestionItem: {
        padding: tokens.spacingVerticalS + ' ' + tokens.spacingHorizontalM,
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: tokens.colorNeutralBackground3,
        },
    },
})

function LocationAutocomplete({ value, onChange, onSelect }) {
    const styles = useStyles()
    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const debounceTimer = useRef(null)

    const searchLocation = async (query) => {
        if (!query || query.length < 3) {
            setSuggestions([])
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
                    query
                )}&format=json&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`
            )
            const data = await response.json()

            if (data.results) {
                setSuggestions(
                    data.results.map((result) => ({
                        name: result.formatted,
                        address: result.formatted,
                        place_id: result.place_id,
                        lat: result.lat,
                        lng: result.lon,
                    }))
                )
            }
        } catch (error) {
            console.error('Error fetching location suggestions:', error)
            setSuggestions([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const newValue = e.target.value
        onChange(newValue)

        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }

        // Set new timer
        debounceTimer.current = setTimeout(() => {
            searchLocation(newValue)
        }, 300) // 300ms debounce
    }

    const handleSuggestionClick = (suggestion) => {
        onChange(suggestion.name)
        onSelect(suggestion)
        setSuggestions([])
    }

    return (
        <div className={styles.container}>
            <Input
                value={value}
                onChange={handleInputChange}
                placeholder="Search for a location..."
            />
            {suggestions.length > 0 && (
                <div className={styles.suggestions}>
                    <Listbox>
                        {suggestions.map((suggestion) => (
                            <Option
                                key={suggestion.place_id}
                                value={suggestion.place_id}
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion.name}
                            </Option>
                        ))}
                    </Listbox>
                </div>
            )}
        </div>
    )
}

export default LocationAutocomplete 