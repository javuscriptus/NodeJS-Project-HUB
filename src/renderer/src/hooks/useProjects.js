import { useState, useCallback } from 'react';

/**
 * Custom hook для управления состоянием проектов
 * Упрощает работу со сканированием и фильтрацией проектов
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Сканирует папку и загружает проекты
   */
  const scanProjects = useCallback(async (rootPath) => {
    if (!rootPath) {
      setError('Root path is required');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.scanProjects(rootPath);
      
      if (result.success) {
        setProjects(result.projects);
        return { success: true, count: result.projects.length };
      } else {
        setError(result.error || 'Scan failed');
        return { success: false };
      }
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Обновляет данные проекта в списке
   */
  const updateProject = useCallback((projectPath, updates) => {
    setProjects(prev => 
      prev.map(project => 
        project.path === projectPath 
          ? { ...project, ...updates }
          : project
      )
    );
  }, []);

  /**
   * Удаляет проект из списка
   */
  const removeProject = useCallback((projectPath) => {
    setProjects(prev => prev.filter(project => project.path !== projectPath));
  }, []);

  /**
   * Очищает все проекты
   */
  const clearProjects = useCallback(() => {
    setProjects([]);
    setError(null);
  }, []);

  return {
    projects,
    loading,
    error,
    scanProjects,
    updateProject,
    removeProject,
    clearProjects,
  };
}

