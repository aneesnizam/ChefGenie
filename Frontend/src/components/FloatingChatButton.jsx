import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingChatButton() {
  const navigate = useNavigate()
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={()=>{navigate('/app/chat')}}
        className="relative w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full shadow-2xl 
                   flex items-center justify-center hover:scale-110 transition-transform duration-300 overflow-hidden"
      >
        <MessageCircle className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        <span className="absolute inset-0 rounded-full bg-primary blur-xl animate-pulse pointer-events-none"></span>
      </button>
    </div>
  );
}
