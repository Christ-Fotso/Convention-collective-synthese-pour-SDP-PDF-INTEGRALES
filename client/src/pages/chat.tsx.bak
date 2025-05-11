import { useEffect } from "react";
import { useParams, useLocation } from "wouter";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  
  // Rediriger automatiquement vers la page des sections
  useEffect(() => {
    if (id) {
      setLocation(`/convention/${id}`);
    } else {
      setLocation('/');
    }
  }, [id, setLocation]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirection en cours...</p>
    </div>
  );
}