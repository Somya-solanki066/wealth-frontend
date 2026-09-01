"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContent } from "@/hooks/useContent";

interface PolicyPageProps {
  pageId: string;
  defaultTitle: string;
}

export default function PolicyPage({ pageId, defaultTitle }: PolicyPageProps) {
  const { content, loading } = useContent(pageId);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-grow pt-[100px] pb-24 max-w-4xl mx-auto px-6 w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-[var(--gd)] animate-pulse">
            Loading...
          </div>
        ) : (
          <div className="prose prose-invert prose-gold max-w-none">
            <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-8 border-b border-[#242424] pb-6">
              {content.title || defaultTitle}
            </h1>
            
            <div className="whitespace-pre-wrap text-[#909090] text-lg leading-relaxed">
              {content.body || `The content for ${defaultTitle} has not been added yet. Please use the Admin Content Editor to add a "body" field.`}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
