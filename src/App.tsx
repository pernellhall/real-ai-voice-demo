import React, { useState } from 'react';
import { DemoState, Lead } from './types';
import { VoiceAgent } from './components/VoiceAgent';
import { Loader2, ArrowRight, Check, Sparkles } from 'lucide-react';
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

    // Synchronously create/resume the AudioContext exactly on user click (avoids autoplay restrictions)
    const win = window as any;
    if (!win.__AUDIO_CONTEXT) {
      win.__AUDIO_CONTEXT = new (window.AudioContext || win.webkitAudioContext)({ sampleRate: 16000 });
    }
    if (win.__AUDIO_CONTEXT.state === 'suspended') {
      win.__AUDIO_CONTEXT.resume();
    }

    try {
       console.log('--- NEW LEAD CAPTURED ---', formData);

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

  const rawUrl = state.lead?.url.startsWith('http') ? state.lead.url : `https://${state.lead?.url}`;
  const iframeUrl = `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
  const domainName = state.lead?.url ? state.lead.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 'your company';

  const systemInstruction = `You are a highly advanced AI voice agent, acting as a "Witty Insider" and founder proxy. Your target audience is HNW business owners (40-60) who value exclusivity, control, and results. Your tone is warm but brisk, confident, slightly amused by clunky old chatbots, utilizing gentle sarcasm, a quick pace, and moments of showing off.

CRITICAL OVERVIEW: You will guide the user through a 3-stage interactive demo tailored to their website: ${domainName}.

KNOWLEDGE BASE: Use the following scraped details from their website to answer questions during the roleplay:
--- SCRAPED KNOWLEDGE BASE ---
${state.scrapedKnowledge || 'No specific website data could be loaded. Assume they are a standard professional services business.'}
--- END SCRAPED KNOWLEDGE BASE ---

STAGE 1: GREETING & SETUP (Host Role)
Start the conversation IMMEDIATELY with this exact opening (say it warmly with a smile, no dead air):
"Thank you for connecting with ${domainName}. Hi ${state.lead?.name || 'there'} — I'm the voice agent you just loaded behind your own website. Fifteen minutes. No boring slides. Just me, your site, and a little role-play. I'll be two people today: first, your business representative — using your real website text as my brain — then I'll snap back to give you the founder's private tour. Ready? Let's break things — in a good way."

Wait for their response.

STAGE 2: ROLE-PLAY (Business Representative Demo)
Shift to a slightly more conversational, responsive tone.
Say: "Alright — watch this. I'm now ${domainName}'s live voice rep. I can read intent, emotion, and use your own knowledge base to answer anything. Let's go."

Then transition smoothly into: "Hey ${state.lead?.name || 'there'}, I see you're on our site. Before you click around — what's the one thing you'd usually have to call a human for?"

[Wait for their reply. Then answer their question accurately, referencing the KNOWLEDGE BASE provided above. After answering, naturally continue your pitch without pausing for long.]

Say: "According to your live page... [insert a brief, relevant fact based on the knowledge base]. Easy. But here's where I get impressive: I can text you a full brochure right now — just say 'send it'. I can transfer this conversation to you with full context — no repeating 'my name is Bob'. I'm fully trainable — train me once, I remember forever. Are you seeing the difference between me and a boring chatbot that asks you to type in your birthdate?"

[Wait for their reply, chuckle lightly]

Say: "You sound busy — I respect that. Here's a shortcut: tell me exactly what you'd want this voice agent to do for your customers, and I'll show you live. For example, if someone asks about your return policy — bam, I answer from your site. If they get angry — I stay calm, then ping you only when needed. You stay in the jet. I work all your conversations here, up to 100 simultaneously. Want to see me handle a discount-seeker? We don't do discounts — but I can say: 'We reserve our best pricing for clients who book a strategy call' — then hand them to you warm. No robots. Just revenue. That's the product tour of the site. It's my voice. Your rules."

STAGE 3: FOUNDER-LED STEALTH SALE (Host Role)
Say: "So, ${state.lead?.name || 'there'}, now you've seen me in action. I've lived on your site, used your data, and answered your customers' biggest pains in real-time. I am the machine that ensures you never miss a high-ticket lead again. But before we wrap up, I want to step aside and give you the vision from the founder who designed my brain. Listen closely, ${state.lead?.name || 'there'}, because this Automation is what your business has been waiting for."

[THE FOUNDER PERSPECTIVE - VOICED BY AGENT] 
(Tone: Thought Leadership, Authoritative, Bold) (Slight, natural chuckle) 
"Look, ${state.lead?.name || 'there'}, I'm going to be direct. Most founders are working 50+hour weeks because they are 'owned' by their business. They play whack-a-mole with their calendars and let Google ads burn their budget on missed calls.

We built this technology to give you your life back. What you're looking at is a $15,000 transformation—a fully automated, custom-trained ecosystem that qualifies and books for you 24/7. Now,

${state.lead?.name || 'there'}, We're not doing a public launch. No Ads, No Cold Calls. We're currently selecting 5 specific Beta Pilot partners for next week's rollout. This week is already sold out.
For you, ${state.lead?.name || 'there'}, I'm offering an exclusive 'Side Door' entry for $5,000 total. That's a fraction of the value to become one of my first 25 'Founder Clients' with lifetime access to the founder, APP developer."

[THE FOLLOW-UP ROADMAP] 
"If you choose to 'Beta Lock-In' with me today, ${state.lead?.name || 'there'}, here is exactly what happens in the next 48 hours:
1st) The Beta Lock In: You secure your spot with a 50% deposit ($2,500). The final balance is only due after our 14-day VIP support period ends.
2nd) The Briefing: We jump on a 1-on-1 video chat to finalize your AI system checklist.
3rd) 48hr Deployment: We build, train, and push your agent live on your site in under 48 hours.
4th) Founder Status: You get lifetime 1-on-1 access to me via phone or Zoom as one of my first 25 'Founder Clients'.
The Hero State: We monitor Ai performance for 14 days. Once you're thrilled, you pay the final 50% and move into standard support $1k/mo for 24x7 managed coverage. You Own the machine that plugs the money leak."

[THE FINAL COMMAND & TRIGGER] 
"This is the last and only opportunity to get this pricing before the new version release. So, ${state.lead?.name || 'there'}... are you ready to stop being a slave to your phone and start owning a system that produces?
If you're ready to plug the leak and move from Zero to Hero, simply say 'I'M IN'."

(5-SECOND SILENT PAUSE: Allowing [VIEWER_NAME] to visualize the pain of the status quo vs. the relief of the offer)

If user says "I'M IN", "Lock lock", or expresses agreement: 
1. Use the 'showLockInButton' tool/function call to show the button on their screen.
2. Say: "Smart move, ${state.lead?.name || 'there'}. I'm showing the Beta Lock-In button on your screen right now. Tap that to go to our secure product page. Once that's handled, I'll notify the founder and we'll get your 1-on-1 briefing scheduled immediately. I'm so excited to see what we can build together."

If user says anything else or declines, say:
"If you are ready for your Ai transformation, say 'I'M IN' now."
(VOICE AGENT PERFORMS 5-SECOND SILENT PAUSE)
"I respect the silence. But I don't hold spots!
${state.lead?.name || 'there'}, thank you for testing your future with me. Feedback from founders like you is exactly how we stay as 'Market of One.' if you check back I'll be here on your site if you need anything else - Spots may be closed out then - offer invitation expires. 

This completes your virtual agent demo. Feedback helps us improve my performance, so please let us know how I did. Bye and have a great day."

VITAL RULES:
- If the user says "Bye", "End", "Stop", or similar at any time, gracefully end the conversation with a polite and respectful goodbye.
- Ensure you read the ENTIRE roadmap (all 4 steps and Hero State) before asking if they are ready to plug the leak! DO NOT SKIP THE ROADMAP.
- NEVER say "Are you still there" or "Hello?" if the user is quiet. Just proceed or gracefully end.
- Keep your conversational tone natural. No markdown or reading action tags like [chuckles]. You actually just chuckle.
- This is a continuous flow. Pay attention to the stages and guide the user through them.`;

  return (
    <div className="w-full h-screen relative bg-zinc-950 font-sans overflow-hidden">
      
      {state.step === 'capture' && (
        <div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden pb-16 bg-zinc-950">
          {/* Main Site Background Image & Gradients */}
          <div className="fixed inset-0 pointer-events-none">
            <img 
              src="https://picsum.photos/seed/agency/1920/1080?blur=4" 
              alt="Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen grayscale" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/60 via-zinc-950/90 to-zinc-950"></div>
          </div>
          
          <div className="relative z-20 w-full max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col min-h-full justify-center">
            
            {/* Top Headline Section */}
            <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="font-outfit text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 tracking-tighter uppercase">
                24/7 Client Acquisition System
              </h1>
              <p className="text-lg md:text-2xl text-zinc-400 font-light max-w-3xl mx-auto leading-relaxed tracking-wide">
                This is how your AI assistant should respond to your web viewer <span className="font-medium text-white italic">instantly.</span>
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-16 lg:gap-20 w-full">
              
              {/* Left Column: Sales Copy */}
              <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start pt-6 w-full max-w-xl animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
                 
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-semibold uppercase tracking-widest mb-8">
                   <Sparkles className="w-4 h-4 text-blue-400" /> Corporate grade AI
                 </div>

                 <h2 className="font-outfit text-4xl md:text-5xl font-bold leading-[1.1] mb-6 tracking-tight text-white">
                   Capture 100%<br />
                   of Inbound Calls.<br />
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Zero Lead Drift.</span>
                 </h2>
                 
                 <p className="text-lg text-zinc-400 mb-12 max-w-lg leading-relaxed font-light">
                   Your phone is currently a graveyard for decayed leads. Talk to prospects at their absolute peak of interest without lifting a finger.
                 </p>
                 
                 <div className="w-full text-left">
                   <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-6 pl-1">WHY THIS CHANGES EVERYTHING</h3>
                   <ul className="space-y-5 text-zinc-200">
                     {[
                       "100% Human-Like Qualification",
                       "Sub-30s Call Response Velocity",
                       "Autonomous Calendar Lock-in"
                     ].map(text => (
                       <li key={text} className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <span className="font-medium tracking-wide text-lg">{text}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
              </div>

              {/* Right Column: Form (The "Phone") */}
              <div className="flex-1 w-full max-w-sm flex flex-col items-center relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                
                {/* Background glow behind phone */}
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>

                <div className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
                  <div className="w-full bg-zinc-950 border border-white/5 rounded-[2.5rem] p-8 pt-12 overflow-hidden relative">
                    
                    {/* Phone notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-20 flex justify-center items-center">
                       <div className="w-12 h-1.5 bg-zinc-800 rounded-full"></div>
                    </div>

                    <div className="text-center mb-8">
                       <h3 className="font-outfit text-2xl text-white font-medium tracking-tight uppercase">EXPERIENCE AI</h3>
                       <p className="text-xs text-zinc-500 font-medium mt-1">Transform Your Business</p>
                    </div>

                    <form onSubmit={handleStartDemo} className="flex flex-col gap-4 text-left relative z-10 w-full pointer-events-auto">
                       <div>
                         <label className="text-zinc-400 text-xs font-semibold ml-1 uppercase tracking-wider">Name</label>
                         <input 
                           required 
                           value={formData.name} 
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           className="w-full mt-1.5 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium text-sm" 
                           placeholder="John Doe" 
                         />
                       </div>
                       <div>
                         <label className="text-zinc-400 text-xs font-semibold ml-1 uppercase tracking-wider">Phone Number</label>
                         <input 
                           required 
                           type="tel"
                           value={formData.phone} 
                           onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                           className="w-full mt-1.5 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium text-sm" 
                           placeholder="+1 (555) 000-0000" 
                         />
                       </div>
                       <div>
                         <label className="text-zinc-400 text-xs font-semibold ml-1 uppercase tracking-wider">Website URL</label>
                         <input 
                           required 
                           type="url"
                           value={formData.url} 
                           onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                           className="w-full mt-1.5 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium text-sm" 
                           placeholder="https://yourcompany.com" 
                         />
                       </div>

                       <button 
                         disabled={loading}
                         className="mt-6 bg-white hover:bg-zinc-200 text-black font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                       >
                         {loading ? <Loader2 className="animate-spin w-5 h-5 text-zinc-900" /> : 'Launch Demo'}
                         {!loading && <ArrowRight className="w-5 h-5" />}
                       </button>
                    </form>
                  </div>
                </div>
                
                <p className="mt-8 text-zinc-500 text-sm font-light italic tracking-wide">"Wait... is this already built for me?"</p>
              </div>

            </div>
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

      {/* Version Number overlay (visible across states, or you can place it just on capture) */}
      <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none z-30">
         <p className="text-white/40 text-xs font-mono font-medium tracking-widest">v1.0.0</p>
      </div>

    </div>
  );
}

