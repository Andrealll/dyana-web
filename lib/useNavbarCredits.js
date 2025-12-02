"use client";

import { useEffect, useState } from "react";
import { getToken, fetchCreditsState } from "./authClient";

/**
 * Hook centralizzato per popolare la DyanaNavbar con
 * - ruolo utente
 * - crediti totali disponibili
 *
 * Lo userai su TUTTE le pagine che mostrano la navbar.
 */
export function useNavbarCredits() {
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    async function loadCredits() {
      try {
        const token = getToken();
        if (!token) {
          // Nessun login → guest senza crediti
          setUserRole("guest");
          setUserCredits(0);
          return;
        }

        const cs = await fetchCreditsState(token);
        // per ora distinguiamo solo free/premium
        const role = cs.paid > 0 ? "user" : "free";

        setUserRole(role);
        setUserCredits(cs.total_available ?? 0);
      } catch (err) {
        console.error("[NAVBAR CREDITS] errore:", err);
        // in caso di errore non blocchiamo la pagina
        setUserRole("guest");
        setUserCredits(0);
      }
    }

    loadCredits();
  }, []);

  return { userRole, userCredits };
}
