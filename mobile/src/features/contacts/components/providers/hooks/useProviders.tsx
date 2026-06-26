import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ContactsService } from "../../../services/contact.service";
import { ContactType } from "../../../types/contact.type";

export const useProviders = () => {
  const [providers, setProviders] = useState<ContactType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const all = await ContactsService.getProviders();
      setProviders(all);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return {
    providers,
    isLoading,
    isRefreshing,
    loadData,
    setIsRefreshing,
  }
};
