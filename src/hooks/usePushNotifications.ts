import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { requestNotificationPermission, initializeFirebase } from "@/lib/firebase";
import { getMessaging, onMessage } from "firebase/messaging";
import { toast } from "sonner";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("push_token")
        .eq("user_id", user.id)
        .single();

      if (data?.push_token) {
        setIsEnabled(true);
        setToken(data.push_token);
      }
    };

    checkNotificationStatus();
  }, [user]);

  useEffect(() => {
    if (!isEnabled) return;
    
    let isMounted = true;
    
    const setupMessageListener = () => {
      try {
        const { app } = initializeFirebase();
        if (!app) return;
        
        const messaging = getMessaging(app);
        
        const unsubscribe = onMessage(messaging, (payload: any) => {
          if (isMounted && payload?.notification) {
            toast(payload.notification.title || 'Neue Benachrichtigung', {
              description: payload.notification.body,
            });
          }
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up message listener:", error);
      }
    };
    
    const unsubscribe = setupMessageListener();
    
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isEnabled]);

  const enableNotifications = useCallback(async () => {
    if (!user) {
      toast.error("Bitte melde dich zuerst an");
      return false;
    }

    // Check if notifications are supported
    if (!("Notification" in window)) {
      toast.error("Dein Browser unterstützt keine Push-Benachrichtigungen");
      return false;
    }

    // Check current permission state
    if (Notification.permission === "denied") {
      toast.error("Push-Benachrichtigungen wurden blockiert. Bitte erlaube sie in den Browser-Einstellungen.");
      return false;
    }

    setIsLoading(true);
    try {
      const fcmToken = await requestNotificationPermission();
      
      if (!fcmToken) {
        toast.error("Push-Benachrichtigungen konnten nicht aktiviert werden. Bitte erlaube Benachrichtigungen im Browser.");
        return false;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ push_token: fcmToken })
        .eq("user_id", user.id);

      if (error) throw error;

      setToken(fcmToken);
      setIsEnabled(true);
      toast.success("Push-Benachrichtigungen aktiviert!");
      return true;
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Fehler beim Aktivieren der Benachrichtigungen");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const disableNotifications = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ push_token: null })
        .eq("user_id", user.id);

      if (error) throw error;

      setToken(null);
      setIsEnabled(false);
      toast.success("Push-Benachrichtigungen deaktiviert");
      return true;
    } catch (error) {
      console.error("Error disabling notifications:", error);
      toast.error("Fehler beim Deaktivieren der Benachrichtigungen");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const toggleNotifications = useCallback(async () => {
    if (isEnabled) {
      return disableNotifications();
    } else {
      return enableNotifications();
    }
  }, [isEnabled, enableNotifications, disableNotifications]);

  const sendTestNotification = useCallback(async () => {
    if (!token) {
      toast.error("Bitte aktiviere zuerst Push-Benachrichtigungen");
      return false;
    }

    if (!user) {
      toast.error("Bitte melde dich zuerst an");
      return false;
    }

    try {
      // Get the current session to include auth token
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        toast.error("Sitzung abgelaufen. Bitte melde dich erneut an.");
        return false;
      }

      const { data, error } = await supabase.functions.invoke("test-notification", {
        body: { 
          token,
          title: "Test von OneAnime",
          body: "Push-Benachrichtigungen funktionieren! 🎉"
        },
      });

      if (error) {
        // Check for auth errors
        if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
          toast.error("Sitzung abgelaufen. Bitte melde dich erneut an.");
          return false;
        }
        throw error;
      }

      if (data?.success) {
        toast.success("Test-Benachrichtigung gesendet!");
        return true;
      } else {
        toast.error("Fehler: " + (data?.error || "Unbekannt"));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
      toast.error("Fehler beim Senden: " + errorMessage);
      return false;
    }
  }, [token, user]);

  return {
    isEnabled,
    isLoading,
    token,
    enableNotifications,
    disableNotifications,
    toggleNotifications,
    sendTestNotification,
  };
};
