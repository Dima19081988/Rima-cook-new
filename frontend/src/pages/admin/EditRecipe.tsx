import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recipesApi } from "../../api/recipes";
import type { RecipeImage, RecipeStep } from "../../types/recipe";
import styles from './CreateRecipe.module.css';

interface Category {
    id: number;
    name: string;
}

export default function EditRecipe() {
    const { id } = useParams<{ id: string }>();
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
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
    const [images, setImages] = useState<RecipeImage[]>([]);
    const [steps, setSteps] = useState<RecipeStep[]>([]);
    const [currentStep, setCurrentStep] = useState<{ title: string, description: string }>({
        title: '',
        description: ''
    });
    const [stepImages, setStepImages] = useState<File[]>([]);
    const [stepImagePreviews, setStepImagePreviews] = useState<{[key: number]: string}>({});
    // const [multipleFiles, setMultipleFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            try {
                const recipeFull = await recipesApi.getAdminRecipeById(Number(id));
                if (!recipeFull) {
                    setError('Рецепт не найден');
                    setLoading(false);
                    return;
                }
                setFormData({
                    title: recipeFull.title,
                    slug: recipeFull.slug,
                    description: recipeFull.description || '',
                    cooking_time: recipeFull.cooking_time || '',
                    servings: recipeFull.servings?.toString() || '',
                    difficulty: recipeFull.difficulty || 'medium',
                })

                setSelectedCategories((recipeFull.category_ids || []).map(String));
                setCurrentImageUrl(recipeFull.image_url || '');
                setImages(recipeFull.images || []);

                if (recipeFull.steps) {
                    setSteps(recipeFull.steps);
                }

                console.log(' ЗАГРУЗКА РЕЦЕПТА:');
                console.log('  - Главное фото (image_url):', recipeFull.image_url);
                console.log('  - Все доп. фото (images):', recipeFull.images);
                console.log('  - Шаги (steps):', recipeFull.steps);
                console.log('  - Количество шагов:', recipeFull.steps?.length);
                console.log('  - Количество доп. фото:', recipeFull.images?.length);

                const allImages = recipeFull.images || [];
                const stepCount = recipeFull.steps?.length > 0 
                    ? recipeFull.steps.length 
                    : allImages.length;
                const stepImages = allImages.slice(0, stepCount);
                setImages(stepImages);
                if (recipeFull.steps?.length > 0) {
                    setSteps(recipeFull.steps);
                } else if (allImages.length > 0) {
                    const placeholderSteps = allImages.map((_, i) => ({
                        title: `Шаг ${i + 1}`,
                        description: '',
                        sort_order: i
                    }));
                    setSteps(placeholderSteps);
                }
                if (stepImages.length > 0) {
                    const previews: { [key: number]: string } = {};
                    stepImages.forEach((img: RecipeImage, i: number) => {
                        previews[i] = img.image_url;
                    });
                    setStepImagePreviews(previews);
                }
                const cats = await recipesApi.getAdminCategories();
                setCategories(cats);
            } catch (error) {
                setError('Ошибка загрузки рецепта');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'title') {
            const slug = value
                .toLowerCase()
                .replace(/[^а-яa-z0-9\s-]/g, '')
                .trim()
                .split(/\s+/)
                .join('-');
            setFormData(prev => ({ ...prev, [name]: value, slug }));
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

    const deleteStep = async (index: number) => {
        if (index >= steps.length) {
            console.error(`Неверный индекс шага: ${index}, всего шагов: ${steps.length}`);
            return;
        }
        console.log(`🗑️ Удаляем шаг ${index + 1} из ${steps.length}`);
        console.log('📷 Текущие images:', images);
        console.log('📝 Текущие steps:', steps);

        const imageToDelete = images[index];
        setSteps(steps.filter((_, i) => i !== index));

        if (imageToDelete) {
            try {
                console.log(`Удаляю фото шага ${index + 1}: ${imageToDelete.id}`);
                await recipesApi.deleteStepImage(Number(id!), imageToDelete.id);
            } catch (error) {
                console.error('Ошибка удаления фото шага:', error);
            }
        } else {
        console.log(`ℹ️ Для шага ${index + 1} нет фото`);
        }

        setStepImages(prev => prev.filter((_, i) => i !== index));
        setImages(prev => prev.filter((_, i) => i !== index));
        setStepImagePreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[index];
            return newPreviews;
        });
        console.log('✅ Шаг удалён');
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

    const uploadStepImages = async () => {
        if (!id || stepImages.filter(Boolean).length === 0) return;
        
        const formData = new FormData();
        stepImages.filter(Boolean).forEach(file => formData.append('step-images', file));
        
        try {
            console.log(`📤 Загружаем ${stepImages.filter(Boolean).length} фото шагов...`);
            const response = await recipesApi.addStepImages(Number(id), formData);
            console.log('✅ Фото шагов загружены:', response);
            
            const recipeFull = await recipesApi.getRecipeById(Number(id));
            const stepCount = recipeFull.steps?.length || 0;
            const newStepImages = recipeFull.images?.slice(0, stepCount) || [];
            setImages(newStepImages);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки фото шагов:', error);
            setError('Ошибка загрузки фото шагов');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

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
        if (fileInputRef.current?.files?.[0]) {
            formDataObj.append('image', fileInputRef.current.files[0]);
            console.log('Отправляем новое главное фото');
        } else {
            console.log('ℹГлавное фото не меняем');
        }

        try {
            await recipesApi.updateRecipe(Number(id), formDataObj);

            if (stepImages.filter(Boolean).length > 0) {
                await uploadStepImages();
            }

            navigate('/admin', { replace: true }); 
        } catch (error) {
            console.error('Ошибка обновления рецепта', error);
            setError('Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <div>Загрузка рецепта...</div>
                </div>
            </div>
        )
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>✏️ Редактировать рецепт</h1>
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
                            <label>Время приготовления</label>
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
                        <select 
                            multiple
                            value={selectedCategories}
                            onChange={handleCategoriesChange}
                            className={styles.multiSelect}
                            size={5}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label>Фото (оставить текущее или загрузить новое)</label>
                        {currentImageUrl && (
                            <div className={styles.currentImage}>
                                <img 
                                    src={currentImageUrl} 
                                    alt="Текущее"
                                    style={{ maxWidth: '200px', maxHeight: '150px' }} 
                                />
                                <small>Текущее фото</small>
                            </div>
                        )}
                        <input 
                            type="file"
                            ref={fileInputRef}
                            name="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.fileInput}
                        />
                        {imagePreview && (
                            <div className={styles.imagePreview}>
                                <img src={imagePreview} alt="Новое превью" />
                                <small>Новое фото (заменит текущее)</small>
                            </div>
                        )}
                    </div>

                    {stepImages.filter(Boolean).length > 0 && (
                        <div className={styles.field}>
                            <label>🖼️ Фото шагов</label>
                            <div className={styles.multipleFilesInfo}>
                                <strong>📁 Выбрано фото шагов: {stepImages.filter(Boolean).length}</strong>
                                <button
                                    type="button"
                                    onClick={uploadStepImages}
                                    disabled={saving}
                                    className={styles.addBtn}
                                >
                                    🖼️ Загрузить фото шагов ({stepImages.filter(Boolean).length})
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {images.length > 0 && (
                        <div className={styles.imagesGallery}>
                            <h4>🖼️ Фото шагов ({Math.min(images.length, steps.length)})</h4>
                            <div className={styles.imagesGrid}>
                                {images.slice(0, steps.length).map((img, index) => (
                                    <div key={img.id} className={styles.imageItem}>
                                        <img 
                                            src={img.image_url} 
                                            alt={`Шаг ${index + 1}`}
                                            className={styles.imageThumb} 
                                        /> 
                                        <small className={styles.imageLabel}>
                                            Шаг {index + 1}    
                                        </small>
                                        <button
                                            type="button"
                                            onClick={() => deleteStep(index)}
                                            className={`${styles.deleteBtn} ${styles.smallDelete}`}
                                            title="Удалить фото и этап приготовления"
                                        >
                                            🗑️
                                        </button>           
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                        <button
                            type="submit"
                            disabled={saving || !formData.title}
                            className={styles.submitBtn}
                        >
                            {saving ? '💾 Сохраняем...' : '✅ Обновить'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className={styles.cancelBtn}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
