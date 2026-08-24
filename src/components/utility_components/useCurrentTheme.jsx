export default function useCurrentTheme() {

    const [themeValue, setThemeValue] = useState('');
    const [changed, setChanged] = useState(false);

    const callBackChanged = () => {
      setChanged(prev => !prev);
    }

  useEffect(() => { // get theme settings
    const getThemeSettings = async () => {
      try {
        const getTheme = await fetch('/getcurrenttheme');
      if (getTheme.ok) {
        const currentTheme = await getTheme.json();
        document.querySelector('html').dataset.theme = currentTheme;
        setThemeValue(currentTheme);
      }
      } catch (error) {
        console.error('Failed to fetch current theme:', error);
      }
    }
    getThemeSettings();
  }, [changed]);

  return { themeValue, callBackChanged };
}