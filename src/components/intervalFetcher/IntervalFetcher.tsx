import { useEffect, useState } from 'react';
import config from 'src/config/config';

const IntervalFetcher = () => {
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token');

      if (!token) {
        console.error('Token not found');
        setLoading(false);
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append('authToken', token);

      const requestOptions: RequestInit = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
      };

      setLoading(true);

      try {
        const response = await fetch(`${config.rutaApi}creating_embedding`, requestOptions);
        const result = await response.json();
        console.log('📦 Resultado:', result);
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Ejecutar inmediatamente

    const intervalId = setInterval(fetchData, 60000); // Ejecutar cada 60 segundos

    return () => clearInterval(intervalId); // Limpiar el intervalo al desmontar
  }, []);

  return null; // No necesita renderizar nada
};

export default IntervalFetcher;
