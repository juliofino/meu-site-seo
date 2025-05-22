import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const API_KEY = import.meta.env.VITE_NEWS_API_KEY?.trim() || "";
const COUNTRY = "br";
const PAGE_SIZE = 9;

const categories = [
  { label: "Todas", value: "" },
  { label: "Negócios", value: "business" },
  { label: "Entretenimento", value: "entertainment" },
  { label: "Saúde", value: "health" },
  { label: "Ciência", value: "science" },
  { label: "Esportes", value: "sports" },
  { label: "Tecnologia", value: "technology" },
];

const texts = {
  pt: {
    loading: "Carregando notícias...",
    errorApiKey: "API Key ausente ou inválida. Verifique sua configuração.",
    errorFetch: "Erro ao buscar notícias. Tente novamente mais tarde.",
    noDescription: "Sem descrição disponível.",
    noTitle: "Título não disponível",
    readMore: "Ler mais",
    newsListLabel: "Lista de notícias",
    mainLabel: "Notícias principais",
    highContrastOn: "Ativar alto contraste",
    highContrastOff: "Desativar alto contraste",
    languageSwitch: "Mudar idioma para Inglês",
    categoryLabel: "Categoria",
    searchPlaceholder: "Buscar notícias...",
    prevPage: "Página anterior",
    nextPage: "Próxima página",
    noNewsFound: "Nenhuma notícia encontrada.",
  },
  en: {
    loading: "Loading news...",
    errorApiKey: "API key missing or invalid. Please check your setup.",
    errorFetch: "Error fetching news. Please try again later.",
    noDescription: "No description available.",
    noTitle: "Title not available",
    readMore: "Read more",
    newsListLabel: "News list",
    mainLabel: "Top news",
    highContrastOn: "Enable high contrast",
    highContrastOff: "Disable high contrast",
    languageSwitch: "Switch language to Portuguese",
    categoryLabel: "Category",
    searchPlaceholder: "Search news...",
    prevPage: "Previous page",
    nextPage: "Next page",
    noNewsFound: "No news found.",
  },
};

function NewsCard({ article, highContrast, t, index }) {
  const altText = article.title || t.noTitle;
  return (
    <Card
      key={index}
      className={`rounded-2xl shadow-md hover:shadow-lg transition-all ${
        highContrast ? "border border-white" : ""
      }`}
      aria-label={`Notícia ${index + 1}`}
    >
      <CardContent className="p-4">
        <img
          src={article.urlToImage || "/placeholder.jpg"}
          alt={altText}
          className="w-full h-40 object-cover rounded-md mb-3"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.jpg";
          }}
          loading="lazy"
        />
        <h2 className="text-lg font-bold mb-2">{altText}</h2>
        <p
          className="text-sm mb-2"
          style={{ color: highContrast ? "white" : "#4B5563" }}
        >
          {article.description || t.noDescription}
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-sm focus:outline focus:outline-2 focus:outline-blue-500"
          title={t.readMore}
          aria-label={`${t.readMore} sobre: ${altText}`}
          style={{ color: highContrast ? "#3EA6FF" : undefined }}
        >
          {t.readMore}
        </a>
      </CardContent>
    </Card>
  );
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function NewsSite() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState("pt");
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const t = texts[language];
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const URL = useMemo(() => {
    if (!API_KEY) return null;
    const baseURL = `https://newsapi.org/v2/top-headlines?country=${COUNTRY}&apiKey=${API_KEY}&pageSize=${PAGE_SIZE}&page=${page}`;
    const categoryQuery = category ? `&category=${category}` : "";
    const searchQuery = debouncedSearchTerm
      ? `&q=${encodeURIComponent(debouncedSearchTerm)}`
      : "";
    return `${baseURL}${categoryQuery}${searchQuery}`;
  }, [category, debouncedSearchTerm, page]);

  const fetchNews = useCallback(async () => {
    if (!API_KEY) {
      setError(t.errorApiKey);
      setLoading(false);
      return;
    }
    if (!URL) return;

    setLoading(true);
    setError("");
    try {
      const res = await axios.get(URL);
      if (res.data.status === "ok" && Array.isArray(res.data.articles)) {
        setNews(res.data.articles);
        setTotalResults(res.data.totalResults || 0);
      } else {
        setError("Resposta inesperada da API.");
        setNews([]);
        setTotalResults(0);
      }
    } catch (err) {
      setError(t.errorFetch);
      setNews([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [URL, t.errorApiKey, t.errorFetch]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  function toggleContrast() {
    setHighContrast((prev) => !prev);
  }

  function toggleLanguage() {
    setLanguage((prev) => (prev === "pt" ? "en" : "pt"));
  }

  function handleCategoryChange(e) {
    setCategory(e.target.value);
    setPage(1);
  }

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setPage(1);
  }

  function prevPage() {
    if (page > 1) setPage((p) => p - 1);
  }

  function nextPage() {
    if (page < Math.ceil(totalResults / PAGE_SIZE)) setPage((p) => p + 1);
  }

  return (
    <main
      className={`p-4 min-h-screen ${
        highContrast ? "bg-black text-white" : "bg-white text-gray-900"
      }`}
      role="main"
      aria-label={t.mainLabel}
    >
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div>
          <button
            onClick={toggleContrast}
            className="focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded px-3 py-1 border border-gray-600 dark:border-white"
            aria-pressed={highContrast}
            aria-label={highContrast ? t.highContrastOff : t.highContrastOn}
          >
            {highContrast ? t.highContrastOff : t.highContrastOn}
          </button>
          <button
            onClick={toggleLanguage}
            className="ml-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded px-3 py-1 border border-gray-600 dark:border-white"
            aria-label={t.languageSwitch}
          >
            {language === "pt" ? "English" : "Português"}
          </button>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <label htmlFor="category" className="font-semibold mr-2">
            {t.categoryLabel}:
          </label>
          <select
            id="category"
            value={category}
            onChange={handleCategoryChange}
            className="rounded border border-gray-300 px-2 py-1"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            className="rounded border border-gray-300 px-2 py-1"
            aria-label={t.searchPlaceholder}
          />
        </div>
      </div>
      {loading ? (
        <div
          className="flex justify-center items-center h-40"
          role="status"
          aria-busy="true"
        >
          <Loader2 className="animate-spin w-10 h-10" aria-hidden="true" />
          <span className="sr-only">{t.loading}</span>
        </div>
      ) : error ? (
        <div
          className="text-red-500 text-center font-semibold py-10"
          role="alert"
          tabIndex={0}
        >
          {error}
        </div>
      ) : news.length === 0 ? (
        <div
          className="text-center py-10 font-semibold"
          tabIndex={0}
          role="alert"
          aria-live="polite"
        >
          {t.noNewsFound}
        </div>
      ) : (
        <>
          <section
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            aria-live="polite"
            aria-label={t.newsListLabel}
          >
            {news.map((article, index) => (
              <NewsCard
                key={article.url || index}
                article={article}
                highContrast={highContrast}
                t={t}
                index={index}
              />
            ))}
          </section>
          <div className="flex justify-center items-center mt-6 gap-4">
            <button
              onClick={prevPage}
              disabled={page === 1}
              className="px-4 py-2 rounded border border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t.prevPage}
              aria-disabled={page === 1}
            >
              {t.prevPage}
            </button>
            <span className="font-semibold" aria-live="polite" aria-atomic="true">
              {page}
            </span>
            <button
              onClick={nextPage}
              disabled={page >= Math.ceil(totalResults / PAGE_SIZE)}
              className="px-4 py-2 rounded border border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t.nextPage}
              aria-disabled={page >= Math.ceil(totalResults / PAGE_SIZE)}
            >
              {t.nextPage}
            </button>
          </div>
        </>
      )}
    </main>
  );
}</button></span></button></div></section></></div></option></select></label></div></button></div></main>
