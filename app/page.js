"use client";

import { useState, useEffect, useRef, useMemo } from "react";

export default function HomePage() {
  const [lang, setLang] = useState("si");
  const [showIntro, setShowIntro] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    fetch("/api/items", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load products:", err);
        setProducts([]);
      });

    const timer = setTimeout(() => setShowIntro(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  const content = {
    si: {
      title: "සිරි සසිරි පූජා",
      description:
        "ඔබගේ පූජා සහ ආධ්‍යාත්මික ජීවිතය සඳහා අවශ්‍ය සියලු බෞද්ධ භාණ්ඩ.",
      about: "අප ගැන",
      aboutText:
        "Bowatta, Bingiriya හි පිහිටි විශ්වාසනීය බෞද්ධ භාණ්ඩ වෙළඳසැලකි.",
      products: "අපගේ භාණ්ඩ",
      order: "WhatsApp මගින් ඇණවුම් කරන්න",
      location: "ස්ථානය බලන්න",
      searchPlaceholder: "භාණ්ඩ සොයන්න...",
      all: "සියල්ල",
      stock: "තොගය",
      noItems: "භාණ්ඩ කිසිවක් තවම එක් කර නැත.",
      featured: "විශේෂ භාණ්ඩ",
      browse: "අදම භාණ්ඩ තෝරන්න",
    },
    en: {
      title: "Siri Sasiri Pooja",
      description:
        "All Buddhist items for your offerings and spiritual life.",
      about: "About Us",
      aboutText:
        "A trusted Buddhist items store located in Bowatta, Bingiriya.",
      products: "Our Products",
      order: "Order via WhatsApp",
      location: "View Location",
      searchPlaceholder: "Search products...",
      all: "All",
      stock: "Stock",
      noItems: "No items added yet.",
      featured: "Featured Collection",
      browse: "Browse our sacred items today",
    },
  };

  const t = content[lang];

  const categories = useMemo(() => {
    const list = products
      .map((item) => item?.category?.trim())
      .filter(Boolean);
    return ["all", ...new Set(list)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        item?.name?.toLowerCase().includes(q) ||
        item?.category?.toLowerCase().includes(q) ||
        item?.description?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch && item.active !== false;
    });
  }, [products, selectedCategory, search]);

  return (
    <main className="min-h-screen bg-white">
      <audio ref={audioRef} src="/bell.mp3" />

      {showIntro && (
        <div className="intro">
          <div className="lotus">
            <span></span>
            <div className="particles">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i}></span>
              ))}
            </div>
          </div>

          <p className="introText">
            ඔබට අවශ්‍ය සියලුම පූජා භාණ්ඩ මිලදී ගැනීමට බෝවත්ත පිහිටි සසිරි පූජා
            මැදුර වෙත පිවිසෙන්න.
          </p>
        </div>
      )}

      <div className="langSwitch">
        <button onClick={() => setLang("si")}>සිංහල</button>
        <button onClick={() => setLang("en")}>English</button>
      </div>

      <header className="topbar premiumTopbar">
        <div className="brandWrap">
          <img src="/logo.png" alt="Logo" className="logoImage" />
          <div>
            <h1 className="siteTitle">{t.title}</h1>
            <p className="topSubText">Bowatta, Bingiriya • 0764137145</p>
          </div>
        </div>
      </header>

      <section className="hero premiumHero">
        <div className="heroGlass">
          <p className="heroBadge">{t.featured}</p>
          <h2 className="heroTitle">{t.title}</h2>
          <p className="heroLead">{t.description}</p>
          <p className="heroMini">{t.browse}</p>

          <div className="heroActionRow">
            <a
              href="https://wa.me/94764137145"
              target="_blank"
              rel="noreferrer"
              className="whatsappBtn"
            >
              WhatsApp
            </a>

            <a
              href="https://share.google/VAfHA4n9AMvlbCplg"
              target="_blank"
              rel="noreferrer"
              className="locationBtn"
            >
              {t.location}
            </a>
          </div>
        </div>
      </section>

      <section className="infoSection">
        <div className="infoCard premiumInfoCard">
          <h3>{t.about}</h3>
          <p>{t.aboutText}</p>
        </div>
      </section>

      <section className="shopSection premiumShopSection">
        <div className="shopHeader">
          <div>
            <h2 className="shopTitle">{t.products}</h2>
            <p className="shopSubtitle">{filteredProducts.length} items</p>
          </div>
        </div>

        <div className="shopToolbar">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shopSearch"
          />

          <div className="categoryChips">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`chipBtn ${
                  selectedCategory === cat ? "chipBtnActive" : ""
                }`}
              >
                {cat === "all" ? t.all : cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="emptyState">{t.noItems}</div>
        ) : (
          <div className="productGrid premiumProductGrid">
            {filteredProducts.map((item, index) => {
              const safeName = item?.name || "Item";
              const safePrice = Number(item?.price || 0);
              const safeImage =
                item?.imageUrl && item.imageUrl.length > 0
                  ? item.imageUrl
                  : `https://source.unsplash.com/600x450/?buddhist,offering,${index}`;

              const whatsappText = encodeURIComponent(
                `I want to order ${safeName} - Rs. ${safePrice}`
              );

              return (
                <div
                  key={item._id || index}
                  className="productCard premiumCard"
                >
                  <div className="productImageWrap premiumImageWrap">
                    <img
                      src={safeImage}
                      alt={safeName}
                      className="productImage"
                    />
                    <div className="productImageOverlay">
                      <span className="productCategoryBadge">
                        {item.category || "Buddhist Item"}
                      </span>
                    </div>
                  </div>

                  <div className="productInfo premiumProductInfo">
                    <h3 className="productName">{safeName}</h3>

                    <p className="productDescription">
                      {item.description ||
                        "Sacred item for offerings and pooja needs."}
                    </p>

                    <div className="productMetaRow">
                      <p className="price">Rs. {safePrice.toLocaleString()}</p>
                      <p className="stockText">
                        {t.stock}: {item.quantity || 0}
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/94764137145?text=${whatsappText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="buyBtn premiumBuyBtn"
                    >
                      {t.order}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <a
        href="https://wa.me/94764137145"
        target="_blank"
        rel="noreferrer"
        className="floatingWhatsApp"
      >
        💬
      </a>
    </main>
  );
}