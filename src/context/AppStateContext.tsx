import { createContext, useContext, useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import { DashboardSettings, Player, ThemeColors } from "../types";

const DEFAULT_THEME: ThemeColors = {
  primary: "#2563eb",
  secondary: "#1e40af",
  accent: "#3b82f6",
  background: "#f3f4f6",
  sidebar: "#111827",
};

const DEFAULT_SETTINGS: DashboardSettings = {
  name: "Sports Academy",
  logoUrl: "",
  theme: DEFAULT_THEME,
  darkMode: false,
};

interface AppStateContextType {
  players: Player[];
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  fetchPlayers: () => Promise<void>;
  dashboardSettings: DashboardSettings;
  updateDashboardSettings: (settings: DashboardSettings) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType>({
  players: [],
  addPlayer: async () => {},
  deletePlayer: async () => {},
  fetchPlayers: async () => {},
  dashboardSettings: DEFAULT_SETTINGS,
  updateDashboardSettings: async () => {},
  isDarkMode: false,
  toggleDarkMode: async () => {},
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchDashboardSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "dashboard"));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data() as DashboardSettings;
        setDashboardSettings(settings);
        setIsDarkMode(settings.darkMode || false);
        applyTheme(settings.theme, settings.darkMode || false);
      } else {
        await setDoc(doc(db, "settings", "dashboard"), DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Error fetching dashboard settings:", error);
      toast.error("Failed to load dashboard settings");
    }
  };

  useEffect(() => {
    fetchDashboardSettings();
  }, []);

  const applyTheme = (theme: ThemeColors, darkMode: boolean) => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      const updatedSettings = {
        ...dashboardSettings,
        darkMode: newDarkMode
      };
      
      await setDoc(doc(db, "settings", "dashboard"), updatedSettings);
      setDashboardSettings(updatedSettings);
      setIsDarkMode(newDarkMode);
      applyTheme(updatedSettings.theme, newDarkMode);
      
      toast.success(`${newDarkMode ? 'Dark' : 'Light'} mode enabled`);
    } catch (error) {
      console.error("Error toggling dark mode:", error);
      toast.error("Failed to toggle dark mode");
    }
  };

  const updateDashboardSettings = async (newSettings: DashboardSettings) => {
    try {
      await setDoc(doc(db, "settings", "dashboard"), newSettings);
      setDashboardSettings(newSettings);
      applyTheme(newSettings.theme, newSettings.darkMode || false);
      toast.success("Dashboard settings updated successfully");
    } catch (error) {
      console.error("Error updating dashboard settings:", error);
      toast.error("Failed to update dashboard settings");
      throw error;
    }
  };

  const fetchPlayers = async () => {
    try {
      const playersQuery = query(collection(db, "players"), orderBy("name"));
      const querySnapshot = await getDocs(playersQuery);
      const playersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      setPlayers(playersData);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Failed to fetch players");
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const addPlayer = async (playerData: Omit<Player, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, "players"), {
        ...playerData,
        createdAt: new Date().toISOString()
      });
      const newPlayer = { id: docRef.id, ...playerData };
      setPlayers(prev => [...prev, newPlayer]);
      toast.success("Player added successfully");
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error("Failed to add player");
      throw error;
    }
  };

  const deletePlayer = async (id: string) => {
    try {
      await deleteDoc(doc(db, "players", id));
      setPlayers(prev => prev.filter(player => player.id !== id));
      toast.success("Player deleted successfully");
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error("Failed to delete player");
      throw error;
    }
  };

  const value = {
    players,
    addPlayer,
    deletePlayer,
    fetchPlayers,
    dashboardSettings,
    updateDashboardSettings,
    isDarkMode,
    toggleDarkMode
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}