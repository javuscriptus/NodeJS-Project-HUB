const { transliterate, slugify } = require('transliteration');
const CyrillicToTranslit = require('cyrillic-to-translit-js');

const cyrillicToTranslit = new CyrillicToTranslit();

/**
 * Поисковый движок с поддержкой транслитерации и метаданных
 */
class SearchEngine {
  constructor() {
    this.indexCache = new Map();
  }

  /**
   * Индексирует проект для быстрого поиска
   * @param {Object} project - Данные проекта
   * @param {Object} metadata - Метаданные (tags, aliases, notes)
   * @returns {Object} Поисковый индекс
   */
  indexProject(project, metadata = {}) {
    const { name, path } = project;
    const { tags = [], aliases = [], notes = '' } = metadata;

    // Генерируем поисковые термины
    const searchTerms = [];

    // 1. Название проекта (оригинал + транслитерация)
    searchTerms.push(name.toLowerCase());
    searchTerms.push(this.transliterateToLatin(name).toLowerCase());
    searchTerms.push(this.transliterateToCyrillic(name).toLowerCase());

    // 2. Теги (оригинал + транслитерация)
    tags.forEach(tag => {
      searchTerms.push(tag.toLowerCase());
      searchTerms.push(this.transliterateToLatin(tag).toLowerCase());
      searchTerms.push(this.transliterateToCyrillic(tag).toLowerCase());
    });

    // 3. Алиасы (оригинал + транслитерация)
    aliases.forEach(alias => {
      const cleaned = alias.trim().toLowerCase();
      if (cleaned) {
        searchTerms.push(cleaned);
        searchTerms.push(this.transliterateToLatin(cleaned).toLowerCase());
        searchTerms.push(this.transliterateToCyrillic(cleaned).toLowerCase());
      }
    });

    // 4. Заметки (оригинал + транслитерация)
    if (notes) {
      const noteWords = notes.toLowerCase().split(/\s+/);
      noteWords.forEach(word => {
        if (word.length > 2) { // Игнорируем короткие слова
          searchTerms.push(word);
          searchTerms.push(this.transliterateToLatin(word).toLowerCase());
          searchTerms.push(this.transliterateToCyrillic(word).toLowerCase());
        }
      });
    }

    // Убираем дубликаты
    const uniqueTerms = [...new Set(searchTerms)];

    return {
      project,
      metadata,
      searchTerms: uniqueTerms,
      searchString: uniqueTerms.join(' ')
    };
  }

  /**
   * Транслитерация кириллицы в латиницу
   * @param {string} text - Текст для транслитерации
   * @returns {string} Транслитерированный текст
   */
  transliterateToLatin(text) {
    try {
      return cyrillicToTranslit.transform(text, '_');
    } catch (error) {
      return text;
    }
  }

  /**
   * Транслитерация латиницы в кириллицу (обратная)
   * @param {string} text - Текст для транслитерации
   * @returns {string} Транслитерированный текст
   */
  transliterateToCyrillic(text) {
    try {
      // Базовая обратная транслитерация
      const mapping = {
        'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д',
        'e': 'е', 'yo': 'ё', 'zh': 'ж', 'z': 'з', 'i': 'и',
        'y': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н',
        'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т',
        'u': 'у', 'f': 'ф', 'h': 'х', 'c': 'ц', 'ch': 'ч',
        'sh': 'ш', 'shch': 'щ', 'yu': 'ю', 'ya': 'я'
      };

      let result = text.toLowerCase();
      
      // Замена длинных комбинаций сначала
      result = result.replace(/shch/g, 'щ');
      result = result.replace(/ch/g, 'ч');
      result = result.replace(/sh/g, 'ш');
      result = result.replace(/zh/g, 'ж');
      result = result.replace(/yo/g, 'ё');
      result = result.replace(/yu/g, 'ю');
      result = result.replace(/ya/g, 'я');
      
      // Замена одиночных символов
      for (const [latin, cyrillic] of Object.entries(mapping)) {
        if (latin.length === 1) {
          result = result.replace(new RegExp(latin, 'g'), cyrillic);
        }
      }

      return result;
    } catch (error) {
      return text;
    }
  }

  /**
   * Поиск проектов по запросу
   * @param {string} query - Поисковый запрос
   * @param {Array} projects - Список проектов
   * @param {Object} metadataMap - Map с метаданными проектов { path: metadata }
   * @returns {Array} Отфильтрованный список проектов
   */
  search(query, projects, metadataMap = {}) {
    if (!query || query.trim() === '') {
      return projects; // Возвращаем все проекты если запрос пустой
    }

    const searchQuery = query.trim().toLowerCase();
    
    // Генерируем варианты запроса (оригинал + транслитерации)
    const queryVariants = [
      searchQuery,
      this.transliterateToLatin(searchQuery).toLowerCase(),
      this.transliterateToCyrillic(searchQuery).toLowerCase()
    ];

    // Индексируем проекты если еще не индексированы
    const indexedProjects = projects.map(project => {
      const cacheKey = project.path;
      
      if (this.indexCache.has(cacheKey)) {
        return this.indexCache.get(cacheKey);
      }

      const metadata = metadataMap[project.path] || {};
      const indexed = this.indexProject(project, metadata);
      this.indexCache.set(cacheKey, indexed);
      
      return indexed;
    });

    // Фильтруем проекты
    const results = indexedProjects.filter(indexed => {
      // Проверяем совпадение хотя бы с одним вариантом запроса
      return queryVariants.some(variant => {
        // Частичное совпадение в любом из поисковых терминов
        return indexed.searchTerms.some(term => term.includes(variant));
      });
    });

    // Возвращаем только объекты проектов
    return results.map(indexed => indexed.project);
  }

  /**
   * Поиск по тегу
   * @param {string} tag - Тег для фильтрации
   * @param {Array} projects - Список проектов
   * @param {Object} metadataMap - Map с метаданными проектов
   * @returns {Array} Отфильтрованный список проектов
   */
  filterByTag(tag, projects, metadataMap = {}) {
    return projects.filter(project => {
      const metadata = metadataMap[project.path] || {};
      const tags = metadata.tags || [];
      return tags.includes(tag);
    });
  }

  /**
   * Получает все уникальные теги из проектов
   * @param {Array} projects - Список проектов
   * @param {Object} metadataMap - Map с метаданными проектов
   * @returns {Array} Массив уникальных тегов
   */
  getAllTags(projects, metadataMap = {}) {
    const allTags = new Set();
    
    projects.forEach(project => {
      const metadata = metadataMap[project.path] || {};
      const tags = metadata.tags || [];
      tags.forEach(tag => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }

  /**
   * Очищает кэш индексов
   */
  clearCache() {
    this.indexCache.clear();
  }

  /**
   * Обновляет индекс для конкретного проекта
   * @param {string} projectPath - Путь к проекту
   */
  invalidateProject(projectPath) {
    this.indexCache.delete(projectPath);
  }
}

module.exports = { SearchEngine };

