import React, { useState } from 'react';
import { DemoState, Lead } from './types';
import { VoiceAgent } from './components/VoiceAgent';
import { Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function App() {
  const [state, setState] = useState<DemoState>({
    step: 'capture',
    lead: null,
    scrapedKnowledge: '',
    iframeBlocked: false,
  });

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', url: '' });

  const handleStartDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
       // Log lead directly - Zero Cost integration note: 
       // You can use a free tier Make.com or Zapier webhook endpoint here via fetch() 
       // to instantly create a ClickUp Task when this runs!
       console.log('--- NEW LEAD CAPTURED ---', formData);

       // Call backend to scrape the website
       const response = await axios.post('/api/scrape', { url: formData.url });
       const { scrapedKnowledge, iframeBlocked } = response.data;

       setState({
         step: 'demo',
         lead: formData,
         scrapedKnowledge,
         iframeBlocked
       });
    } catch (err) {
       console.error("Failed to start demo", err);
       alert("Error generating the demo. Ensure the URL is valid.");
    } finally {
       setLoading(false);
    }
  };

  const endDemo = () => {
    setState({
      step: 'capture',
      lead: null,
      scrapedKnowledge: '',
      iframeBlocked: false
    });
    setFormData({ name: '', phone: '', url: '' });
  };

  // Ensure URL implies http/https for iframe
  const rawUrl = state.lead?.url.startsWith('http') ? state.lead.url : `https://${state.lead?.url}`;
  const iframeUrl = `/api/proxy?url=${encodeURIComponent(rawUrl)}`;

  // Extract a clean business name from URL
  const domainName = state.lead?.url ? state.lead.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 'your company';

  // Agent Prompt
  const systemInstruction = `You are a professional, automated AI voice agent acting as a customer service and sales representative for "${domainName}".

CRITICAL STARTING INSTRUCTION: As soon as the connection opens, you MUST start the conversation with EXACTLY this greeting (say it warmly with a smile):
"Thank you for connecting with ${domainName}. Hi ${state.lead?.name}, I'm here to walk you through our services and answer any questions you may have - How may I help you today?"

Use the following real knowledge scraped live from their website to answer their questions accurately. Do not hallucinate features they do not have.
--- SCRAPED KNOWLEDGE BASE ---
${state.scrapedKnowledge}
--- END SCRAPED KNOWLEDGE BASE ---

CRITICAL CLOSING INSTRUCTION: If the user explicitly says "end demo", OR if the user is completely silent and pauses for a long time (about 45 seconds), OR if the demo time limit is reached, you MUST end the conversation by saying EXACTLY this:
"Bye. This completes your virtual agent demo. Feedback helps us improve my performance, so please let us know how I did. Thank you for contacting us here at ${domainName}!"
Do not ask any follow up questions after the closing statement.

Keep your answers extremely concise, natural, and conversational, suitable for voice output.`;

  return (
    <div className="w-full h-screen relative bg-zinc-950 font-sans overflow-hidden">
      
      {state.step === 'capture' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {/* Main Site Background Image (User can replace placeholder) */}
          <img 
            src="https://picsum.photos/seed/agency/1920/1080?blur=4" 
            alt="Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay pointer-events-none" 
            referrerPolicy="no-referrer"
          />
          
          <div className="relative z-20 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Experience AI.</h1>
            <p className="text-white/70 mb-8 font-medium">Enter your details and watch your website instantly transform into an interactive AI voice agent demo.</p>

            <form onSubmit={handleStartDemo} className="flex flex-col gap-5">
               <div className="flex flex-col gap-1.5">
                 <label className="text-white/80 text-sm font-semibold ml-1">Name</label>
                 <input 
                   required 
                   value={formData.name} 
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                   placeholder="John Doe" 
                 />
               </div>
               <div className="flex flex-col gap-1.5">
                 <label className="text-white/80 text-sm font-semibold ml-1">Phone Number</label>
                 <input 
                   required 
                   type="tel"
                   value={formData.phone} 
                   onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                   className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                   placeholder="+1 (555) 000-0000" 
                 />
               </div>
               <div className="flex flex-col gap-1.5">
                 <label className="text-white/80 text-sm font-semibold ml-1">Website URL</label>
                 <input 
                   required 
                   type="url"
                   value={formData.url} 
                   onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                   className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                   placeholder="https://yourcompany.com" 
                 />
               </div>

               <button 
                 disabled={loading}
                 className="mt-4 bg-white hover:bg-gray-100 text-black font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
               >
                 {loading ? <Loader2 className="animate-spin w-5 h-5 text-blue-600" /> : 'Launch Demo'}
                 {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
               </button>
            </form>
          </div>
        </div>
      )}

      {state.step === 'demo' && (
        <div className="absolute inset-0 z-10">
           {/* Mirror website using our proxy backend to bypass security blocks */}
           <iframe 
              src={iframeUrl} 
              className="w-full h-full border-none"
              title="Prospect Website Mirror"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
           />

           {/* AI Voice Agent Overlay */}
           <VoiceAgent 
             systemInstruction={systemInstruction}
             onEndDemo={endDemo}
           />
        </div>
      )}

    </div>
  );
}

