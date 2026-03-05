import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { recipesApi } from "../../api/recipes";
import type { RecipeStep } from "../../types/recipe";
import styles from './CreateRecipe.module.css';

interface Category {
    id: number;
    name: string;
}

export default function CreateRecipe() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        cooking_time: '',
        servings: '',
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    // const [images, setImages] = useState<RecipeImage[]>([]);
    const [steps, setSteps] = useState<RecipeStep[]>([]);
    const [currentStep, setCurrentStep] = useState<{ title: string, description: string }>({
        title: '',
        description: ''
    });
    const [stepImages, setStepImages] = useState<File[]>([]);
    const [stepImagePreviews, setStepImagePreviews] = useState<{[key: number]: string}>({});
    // const [multipleFiles, setMultipleFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await recipesApi.getAdminCategories();
                setCategories(cats)
            } catch (error) {
                console.error('Ошибка загрузки категорий', error);
                setError('Ошибка загрузки категорий');
            }
        };
        loadCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        if (name === 'title') {
            const slug = value
                .toLowerCase()
                .replace(/[^а-яa-z0-9\s-]/g, '')
                .trim()
                .split(/\s+/)
                .join('-');
            setFormData(prev => ({ ...prev, title: value, slug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCategoriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedCategories(options);
    };

    const addStep = () => {
        if (!currentStep.title.trim() || !currentStep.description.trim()) {
            return;
        }

        const newStep: RecipeStep = {
            title: currentStep.title,
            description: currentStep.description,
            sort_order: steps.length
        };

        setSteps([...steps, newStep]);
        setCurrentStep({ title: '', description: '' });
    };

    const deleteStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));

        setStepImages(prev => prev.filter((_, i) => i !== index));
        setStepImagePreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[index];
            return newPreviews;
        });
    };

    const handleStepImageChange = (stepIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setStepImagePreviews(prev => ({
                    ...prev,
                    [stepIndex]: e.target?.result as string
                }));
            };
            reader.readAsDataURL(file);

            setStepImages(prev => {
                const newFiles = [...prev];
                newFiles[stepIndex] = file;
                return newFiles;
            });
        }
    };

    const uploadStepImages = async (recipeId: number) => {
        const validImages = stepImages.filter(Boolean);
        if (validImages.length === 0) return;

        const formData = new FormData();
        validImages.forEach(file => formData.append('step-images', file));

        console.log(`Отправляем ${validImages.length} фото шагов...`);
        await recipesApi.addStepImages(recipeId, formData);
        console.log('Фото шагов загружены!');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        console.log('📝 Отправляем steps:', steps);
        console.log('📝 Количество шагов:', steps.length);
        
        const formDataObj = new FormData();
        formDataObj.append('title', formData.title);
        formDataObj.append('slug', formData.slug);
        if (formData.description) formDataObj.append('description', formData.description);
        if (formData.cooking_time) formDataObj.append('cooking_time', formData.cooking_time);
        if (formData.servings) formDataObj.append('servings', formData.servings);
        formDataObj.append('difficulty', formData.difficulty);
        selectedCategories.forEach(catId => {
            const numericId = typeof catId === 'string' ? parseInt(catId, 10) : catId;
            if (!isNaN(numericId)) {
                formDataObj.append('category_ids[]', String(numericId));
            }
        });
        if (fileInputRef.current?.files?.[0]) formDataObj.append('image', fileInputRef.current.files[0]);
        formDataObj.append('steps', JSON.stringify(steps));
        console.log('📤 Отправляем steps:', {
            count: steps.length,
            first: steps[0],
            stringified: JSON.stringify(steps).slice(0, 100) + '...'
        });

        try {
            console.log('Создаем рецепт...');
            const createdRecipe = await recipesApi.createRecipe(formDataObj);   
            const recipeId = createdRecipe.id;
            console.log('recipeId:', recipeId);
            

            if (stepImages.filter(Boolean).length > 0 && recipeId) {
                console.log('Загружаем фото шагов...');
                await uploadStepImages(recipeId);
            }
            
            navigate('/admin', { replace: true });
        } catch (error) {
            console.error('Ошибка создания:', error);
            setError('Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>➕ Новый рецепт</h1>
                {error && <div className={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Название *</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Slug *</label>
                        <input
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Описание</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className={styles.textarea}
                        />
                    </div>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Время приготовления (мин)</label>
                            <input
                                name="cooking_time"
                                value={formData.cooking_time}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Порций</label>
                            <input
                                name="servings"
                                type="number"
                                value={formData.servings}
                                onChange={handleChange}
                                min={1}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Сложность</label>
                            <select name="difficulty" value={formData.difficulty} onChange={handleChange} className={styles.select}>
                                <option value="easy">Легко</option>
                                <option value="medium">Средне</option>
                                <option value="hard">Сложно</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label>Категории (Ctrl+клик)</label>
                        <select multiple value={selectedCategories} onChange={handleCategoriesChange} className={styles.multiSelect} size={5}>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label>Фото</label>
                        <input 
                            type="file"
                            ref={fileInputRef}
                            name="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.fileInput}
                        />
                        {imagePreview && <div className={styles.imagePreview}><img src={imagePreview} alt="Превью" /></div>}
                    </div>
                    <div className={styles.stepsSection}>
                        <h3>📋 Этапы приготовления</h3>
                        <div className={styles.newStepForm}>
                            <div className={styles.field}>
                                <label>Название этапа <span style={{color: '#ef4444'}}>*</span></label>
                                <input
                                    value={currentStep.title}
                                    onChange={(e) => setCurrentStep({...currentStep, title: e.target.value})}
                                    placeholder="Нарезка, жарка..."
                                    className={styles.input}
                                    maxLength={50}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Описание этапа <span style={{color: '#ef4444'}}>*</span></label>
                                <textarea
                                    value={currentStep.description}
                                    onChange={(e) => setCurrentStep({...currentStep, description: e.target.value})}
                                    placeholder="Что делать на этом шаге..."
                                    rows={3}
                                    className={styles.textarea}
                                    maxLength={500}
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={addStep}
                                disabled={!currentStep.title.trim() || !currentStep.description.trim()}
                                className={`${styles.submitBtn} ${!currentStep.title.trim() || !currentStep.description.trim() ? styles.disabled : ''}`}
                            >
                                ➕ Добавить этап
                            </button>
                        </div>
                    </div>
                    {steps.length > 0 && (
                        <div className={styles.stepsList}>
                            <h4>📝 Добавленные этапы</h4>
                            <div className={styles.stepsGrid}>
                                {steps.map((step, index) => (
                                    <div key={index} className={styles.stepItem}>
                                        <div className={styles.stepContent}>
                                            <div className={styles.stepNumber}>{index + 1}</div>
                                            <div className={styles.stepInfo}>
                                                <strong>{step.title}</strong>
                                                <p>{step.description}</p>
                                                {stepImagePreviews[index] && (
                                                    <div className={styles.stepPreviewWrapper}>
                                                        <img 
                                                            src={stepImagePreviews[index]} 
                                                            alt={`Фото этапа ${index + 1}`}
                                                            className={styles.stepPreview} 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.stepActions}>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={(e) => handleStepImageChange(index, e)}
                                                className={styles.stepImageInput}                                             
                                            />
                                            <button
                                                type="button"
                                                onClick={() => deleteStep(index)}
                                                className={styles.deleteBtn}
                                                title="Удалить этап"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className={styles.buttons}>
                        <button type="submit" disabled={saving || !formData.title} className={styles.submitBtn}>
                            {saving ? 'Создаем...' : '✅ Создать' }
                        </button>
                        <button type="button" onClick={() => navigate('/admin')} className={styles.cancelBtn}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}