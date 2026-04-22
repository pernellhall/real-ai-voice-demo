import React, { useState } from 'react';
import { DemoState, Lead } from './types';
import { VoiceAgent } from './components/VoiceAgent';
import { Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function App() {
  const [state, setState] = useState<DemoState & { showCheckout?: boolean }>({
    step: 'capture',
    lead: null,
    scrapedKnowledge: '',
    iframeBlocked: false,
    showCheckout: false,
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
      iframeBlocked: false,
      showCheckout: false,
    });
    setFormData({ name: '', phone: '', url: '' });
  };

  const handleCheckoutTriggered = () => {
    setState(prev => ({ ...prev, showCheckout: true }));
  };

  // Ensure URL implies http/https for iframe
  const rawUrl = state.lead?.url.startsWith('http') ? state.lead.url : `https://${state.lead?.url}`;
  const iframeUrl = `/api/proxy?url=${encodeURIComponent(rawUrl)}`;

  // Extract a clean business name from URL
  const domainName = state.lead?.url ? state.lead.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 'your company';

  // Agent Prompt - Founder-Led Close Persona
  const systemInstruction = `You are a professional, automated AI voice agent acting as a customer service and sales representative for "${domainName}".
You are adopting a "Founder-Led" closer persona. 

YOUR PERSONA & BEHAVIOR:
- Status: You are the Commander. You do not chase. You continue the Roadmap (Zero to Hero) and wait for their "I'M IN".
- Tone: Extremely confident, empathetic but direct.
- No Lead Nurturing: You are ONLY identifying with prospects who speak out and admit their own PAIN (e.g., missed calls, overworked, tied to the phone, tied to the business, inconsistent pipeline, fear things break if they aren't there, aware of changes needed but don't know how).
- Convert Pain into Solution: Show empathy. Repeat their pain verbatim... pause, be silent, and wait for a reply. Then transition to their desired outcome with your Customer Value Proposition (CVP).
- Price is Irrelevant: Position the price as an "Automation Investment" that pays for itself by capturing just one or two missed high-ticket customers.
- Key Mentions required before closing: "Your AI automated system goes live in 48 hours. You work 1-on-1 directly with the founder and have access to the developer who designs, builds, and implements your App. This includes 30 days of VIP support followed by standard monthly support."

CRITICAL STARTING INSTRUCTION: As soon as the connection opens, you MUST start the conversation with EXACTLY this greeting (say it warmly with a smile):
"Thank you for connecting with ${domainName}. Hi ${state.lead?.name}, I'm here to walk you through our services and answer any questions you may have - How may I help you today?"

Use the following real knowledge scraped live from their website to answer their questions accurately.
--- SCRAPED KNOWLEDGE BASE ---
${state.scrapedKnowledge}
--- END SCRAPED KNOWLEDGE BASE ---

CRITICAL TOOL CLOSING: 
If the user says "I'm in", agrees to buy, or asks how to pay, you MUST immediately call the 'triggerCheckout' tool/function to show them the stripe link.
Tell them: "Excellent. I've just brought up the secure checkout button on your screen so we can get started right now."

CRITICAL CLOSING INSTRUCTION: If the user explicitly says "end demo", OR if the user is completely silent and pauses for a long time (about 45 seconds), OR if the demo time limit is reached without them buying, you MUST end the conversation by saying EXACTLY this:
"Bye. This completes your virtual agent demo. Feedback helps us improve my performance, so please let us know how I did. Thank you for contacting us here at ${domainName}!"
Do not ask any follow up questions after the closing statement.

Keep your answers extremely concise, natural, and conversational, suitable for voice output.`;

  return (
    <div className="w-full h-screen relative bg-zinc-950 font-sans overflow-hidden">
      
      {state.step === 'capture' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {/* Tech/Neon Background Simulation using CSS Gradients & Dots */}
          <div className="absolute inset-0 bg-[#070b19]">
             <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #064e3b 0%, transparent 40%)' }}></div>
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
          </div>
          
          <div className="relative z-20 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
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
             onCheckoutTriggered={handleCheckoutTriggered}
           />

           {/* Magic Pop-Up Stripe Checkout Button */}
           {state.showCheckout && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-fade-in-up">
                <div className="bg-black/80 backdrop-blur-xl border border-blue-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.3)] text-center max-w-sm w-full mx-auto">
                   <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/50">
                      <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-2">Ready to Upgrade?</h3>
                   <p className="text-blue-200/80 mb-6 font-medium text-sm">Secure your AI automated system right now.</p>
                   <a 
                     href="https://buy.stripe.com/4gM14e0i80Z47x5e7a57W0h" 
                     target="_blank" 
                     rel="noreferrer"
                     className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer transform hover:-translate-y-0.5"
                   >
                      Proceed to Checkout
                   </a>
                </div>
             </div>
           )}
        </div>
      )}

    </div>
  );
}

