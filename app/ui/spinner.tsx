import { PulseLoader } from 'react-spinners';

export default function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <PulseLoader size={30} margin={4} color="#3b82f6" />
    </div>
  );
}
