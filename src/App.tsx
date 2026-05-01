import React, { useState, useRef, useEffect } from "react";
import { Upload, ImageIcon, Loader2, Download, Wand2, LogIn, LogOut, Check, Sparkles, Key } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { presets, generateImageVariation } from "./lib/gemini";
import { auth, signInWithGoogle, logOut } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(presets[0].id);
  const [userModifier, setUserModifier] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  const [generatedImages, setGeneratedImages] = useState<{ b64: string; index: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const mimetypeMatch = result.match(/^data:(.*);base64,(.*)$/);
        if (mimetypeMatch) {
          setMimeType(mimetypeMatch[1]);
          setBase64Data(mimetypeMatch[2]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!base64Data || !mimeType) {
      alert("Vui lòng tải lên một bức ảnh chân dung.");
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedImages([]);
      
      const preset = presets.find((p) => p.id === selectedPresetId);
      if (!preset) throw new Error("Không tìm thấy preset.");

      const variations = preset.prompts;

      for (let i = 0; i < variations.length; i++) {
        setLoadingStep(`Đang xử lý ảnh ${i + 1}/3...`);
        try {
          const b64 = await generateImageVariation(variations[i], base64Data, mimeType, userModifier);
          if (b64) {
            setGeneratedImages((prev) => [...prev, { b64, index: i + 1 }]);
          }
        } catch (verr: any) {
          console.error(`Error generating variation ${i + 1}:`, verr);
          if (verr?.status === 429 || verr?.message?.includes("Quota") || verr?.message?.includes("429")) {
             alert("Hạn mức miễn phí đã hết hoặc hệ thống quá tải. Nếu bạn có bản Pro, hãy nhấn 'SỬ DỤNG API KEY PRO' bên dưới để kết nối mã API của riêng bạn.");
             break;
          }
          if (i === 0) throw verr;
        }
      }

      setLoadingStep("Thành công!");
    } catch (err: any) {
      console.error(err);
      alert("Lỗi: " + (err.message || "Đã xảy ra lỗi không xác định."));
    } finally {
      setIsGenerating(false);
      setLoadingStep("");
    }
  };

  const handleDownload = (b64: string, index: number) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${b64}`;
    link.download = `nghiemart-${selectedPresetId}-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfigKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
    } else {
      alert("Hãy nhấn biểu tượng bánh răng (Settings) ở góc trên bên phải trang AI Studio để chọn API Key Pro của bạn.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-orange-500/30">
      <div className="max-w-md mx-auto bg-black min-h-screen shadow-2xl flex flex-col border-x border-neutral-900 relative">
        
        {/* Header */}
        <header className="px-8 py-8 border-b border-neutral-800 bg-black sticky top-0 z-20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-white italic">
              <Sparkles className="w-6 h-6 text-orange-500 fill-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              NGHIEMART
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-orange-500/70 font-black mt-1">Tools Studio v3.1</p>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3 bg-neutral-900 p-1.5 pl-4 rounded-2xl border border-neutral-800">
                <span className="text-[10px] font-black text-neutral-400 uppercase hidden sm:inline">{user.displayName?.split(' ')[0]}</span>
                <img src={user.photoURL || ""} className="w-7 h-7 rounded-xl border border-neutral-700" alt="Avatar" />
                <button onClick={logOut} className="p-2 hover:bg-neutral-800 rounded-xl transition-colors">
                  <LogOut className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={signInWithGoogle} className="text-neutral-500 hover:text-orange-500 font-black text-[10px] uppercase tracking-widest">
                Login
              </Button>
            )}
          </div>
        </header>

        {/* content */}
        <main className="flex-1 px-5 py-8 flex flex-col gap-10">
          
          {/* Upload */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                01. Dữ liệu đầu vào
              </Label>
              {previewUrl && (
                <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[9px] font-black animate-pulse">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                   DATA READY
                </div>
              )}
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative overflow-hidden aspect-square rounded-[3rem] border-2 border-dashed transition-all duration-500 cursor-pointer flex flex-col items-center justify-center bg-neutral-900/30
                ${previewUrl ? "border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.05)]" : "border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/50"}`}
            >
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
              
              {previewUrl ? (
                <div className="absolute inset-0 group">
                  <img src={previewUrl} className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Button variant="secondary" size="sm" className="bg-white text-black font-black rounded-2xl h-12 px-6">Đổi ảnh khác</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-neutral-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-neutral-800 shadow-2xl transition-transform hover:scale-110">
                    <Upload className="w-8 h-8 text-neutral-600" />
                  </div>
                  <p className="text-base font-black text-neutral-200 tracking-tight">TẢI ẢNH CHÂN DUNG</p>
                  <p className="text-[10px] text-neutral-600 mt-2 font-bold uppercase tracking-widest">Supports JPG, PNG, WEBP</p>
                </div>
              )}
            </div>
          </section>

          {/* Functions */}
          <section>
            <Label className="mb-4 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
              Chọn chức năng xử lý
            </Label>
            <div className="grid grid-cols-1 gap-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setGeneratedImages([]); // Clear old results when switching
                  }}
                  className={`relative p-6 rounded-3xl border-2 text-left transition-all duration-300 group overflow-hidden
                    ${selectedPresetId === preset.id 
                      ? "border-orange-500 bg-orange-600/10 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-[1.02]" 
                      : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-800"}`}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <span className={`text-base font-black tracking-tight block transition-colors ${selectedPresetId === preset.id ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`}>
                        {preset.name}
                      </span>
                      <p className={`text-[10px] mt-1 font-bold ${selectedPresetId === preset.id ? "text-orange-400" : "text-neutral-600"}`}>
                        {preset.id === "gao-tam-cam" ? "3 Phiên bản (Cát, Chì, Nước)" : "Siêu nét, Tách nền, Khử noise"}
                      </p>
                    </div>
                    {selectedPresetId === preset.id && (
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/50 animate-in zoom-in duration-300">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  {selectedPresetId === preset.id && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[50px] -mr-16 -mt-16 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Modifier */}
          <section>
            <Label className="mb-4 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
              Yêu cầu tinh chỉnh (Tuỳ chọn)
            </Label>
            <Textarea 
              placeholder="Nhập thêm yêu cầu (vd: làm môi đỏ hơn, tóc đen bóng...)" 
              value={userModifier}
              onChange={(e) => setUserModifier(e.target.value)}
              className="bg-black border-neutral-800 focus:border-orange-500 focus:ring-0 transition-all min-h-[120px] rounded-3xl text-sm placeholder:text-neutral-700 p-6"
            />
          </section>

          {/* Action */}
          <div className="flex flex-col gap-4">
            <Button 
              className="h-20 text-xl font-black bg-orange-600 hover:bg-orange-500 text-white rounded-[2.5rem] shadow-[0_15px_30px_-10px_rgba(249,115,22,0.6)] transition-all active:scale-[0.96] disabled:bg-neutral-800 disabled:text-neutral-600"
              onClick={handleGenerate}
              disabled={isGenerating || !base64Data}
            >
              {isGenerating ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="animate-pulse">ĐANG XỬ LÝ...</span>
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-orange-200 opacity-60">{loadingStep}</span>
                </div>
              ) : (
                <span className="flex items-center gap-4">
                  <Wand2 className="w-7 h-7" />
                  BẮT ĐẦU NGAY
                </span>
              )}
            </Button>
            
            <button 
              onClick={handleConfigKey}
              className="py-3 px-6 rounded-2xl border border-neutral-800 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 hover:text-orange-400 hover:border-orange-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-3 h-3" />
              SỬ DỤNG API KEY PRO (NẾU HẾT LƯỢT MIỄN PHÍ)
            </button>
          </div>

          {/* Results */}
          {generatedImages.length > 0 && (
            <section className="mt-14 mb-14 space-y-10 animate-in slide-in-from-bottom-5 duration-700">
              <div className="flex items-center gap-6">
                <div className="h-px flex-1 bg-neutral-800" />
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase underline decoration-orange-500 decoration-[6px] underline-offset-[8px]">
                  KẾT QUẢ ĐÃ XỬ LÝ
                </h3>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>
              
              <div className="grid grid-cols-1 gap-16">
                {[...generatedImages].reverse().map((img) => (
                  <div key={img.index} className="group flex flex-col gap-5">
                    <div className="relative bg-neutral-950 rounded-[3rem] overflow-hidden border border-neutral-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all hover:border-neutral-700">
                      <img 
                        src={`data:image/png;base64,${img.b64}`} 
                        alt={`Art ${img.index}`} 
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                        <Button 
                          onClick={() => handleDownload(img.b64, img.index)}
                          className="w-full bg-white text-black hover:bg-neutral-200 font-black py-8 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl text-lg uppercase tracking-tight"
                        >
                          <Download className="w-6 h-6" />
                          Tải ảnh chất lượng cao
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4">
                       <span className="text-xs font-black uppercase tracking-[0.3em] text-neutral-600">
                        PHIÊN BẢN {img.index}
                       </span>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => handleDownload(img.b64, img.index)} 
                           className="w-12 h-12 flex items-center justify-center bg-neutral-800 rounded-2xl hover:bg-orange-500 hover:text-white transition-all text-orange-500 shadow-lg"
                         >
                            <Download className="w-5 h-5" />
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!user && (
            <div className="p-8 rounded-[2.5rem] bg-orange-500/5 border border-orange-500/10 text-center mb-10">
              <Sparkles className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <h4 className="text-base font-black text-white mb-2 uppercase tracking-tight">KÍCH HOẠT CHẾ ĐỘ PRO</h4>
              <p className="text-xs text-neutral-500 leading-relaxed mb-6 px-4">
                Đăng nhập để lưu lịch sử và kết nối với các công cụ nâng cao của NghiemArt.
              </p>
              <Button onClick={signInWithGoogle} className="w-full bg-white text-black hover:bg-neutral-200 font-black h-14 rounded-2xl transition-all uppercase text-xs tracking-widest">
                ĐĂNG NHẬP GOOGLE
              </Button>
            </div>
          )}


        </main>
        
        <footer className="p-8 text-center border-t border-neutral-900 bg-neutral-950/50">
           <p className="text-[10px] font-bold text-neutral-600 tracking-[0.2em] uppercase">Powered by Gemini & NghiemArt</p>
        </footer>
      </div>
    </div>
  );
}
