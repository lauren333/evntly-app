import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
# nltk.download('stopwords')
# nltk.download('punkt')
# nltk.download('punkt_tab')

"""
Naive Bayes Algorithm Script: 

This script implements a 3-way Naive Bayes classifier for text data, supporting
English and Spanish. With optional stop word removal.
"""

# Ensure NLTK can find data by checking the stopwords and punkt resources
# try:
#     # Example: Check stopwords
#     stop_words = set(stopwords.words('english'))
#     # print("--- Stopwords loaded successfully. Here is the list of stop words: ---\n")
#     # print(stop_words)

#     # Example: Check punkt tokenizer
#     # sample_text = "Hello world! This is a test."
#     # print("\n--- Sample Text: ---\n" + sample_text)

#     tokenized_text = word_tokenize(sample_text)
#     print("\n--- Punkt tokenizer loaded successfully. Here is the tokenized text: ---")
#     print(tokenized_text)
    
#     #filtered_stop_words = [word for word in stop_words if len(word) > 1]
#     #print("\n--- Filtered out one-letter stopwords: ")
#     #print(filtered_stop_words)

#     #Example 2: Check punkt tokenizer but without one letter stopwords including a...? so maybe remove this idk
#     filtered_tokenized_text = [word for word in tokenized_text if word.lower() not in stop_words or len(word) > 1]
#     print("\n--- Filtered Text (without one-letter stopwords): ---")
#     print(filtered_tokenized_text)
# except LookupError as e:
#     print(f"Error: {e}")

class NaiveBayesClassifier:
    def __init__(self, category_files, language='english', stop_words=True):
        self.category_files = category_files
        self.language = language
        self.stop_words = stop_words
        self.stop_words_list = set()
        self.category_data = {}
        
        if self.stop_words: #is stop words is true, we are using/ considering/ discluding stop words. 
            print("\n------------------- Staring 3 Way Text Classification Discluding Stop Words: -----------------------")
            self._load_stopwords()
        else: 
            print("\n----------------------------- Starting 3 Way Text Classification : ----------------------------------")

        self._process_files() 

        
    def _load_stopwords(self):
        if self.language == 'english':
            self.stop_words_list = set(stopwords.words('english'))
        elif self.language == 'spanish':
            self.stop_words_list = set(stopwords.words('spanish'))
        else:
            raise ValueError("Supported languages: 'english' or 'spanish'")
            
        # print(f"\n--- {self.language.capitalize()} stopwords loaded: ---")
        # print(self.stop_words_list)
        
    def extract_words(self,text):
        if self.stop_words: #if discluding stop words. 
            words = [
                word.lower() for word in word_tokenize(text)
                if any(c.isalpha() for c in word) and word.lower() not in self.stop_words_list
            ] 
        else:      
            words = [
                word.lower() for word in word_tokenize(text)
                if any(c.isalpha() for c in word)
             ] 
        return words   
    
    
    def _process_files(self):
        # "Items () method in the dictionary is used to return each item in a dictionary as tuples in a list"
        for category, filename in self.category_files.items(): #remeber category_files is a dictionary with keys: categories, val: txt file
            words, line_count = self.load_file(filename) #load_file outputs words, a list of words from the file, and line count is num of line 
            self.category_data[category] = words #create a dictionary with categories name, and the list of words associated
            
            #For debugging
            # print(f"\n--- Full Content in '{filename}' for category '{category}' ---")
            # print(words, line_count) 
            if self.stop_words: 
                print(f"--- There is {len(words)} words in {filename} when REMOVING stop words. ---") 
            else: 
                print(f"--- There is {len(words)} words in {filename} when INCLUDING stop words. ---")
            

    def load_file(self, file_name):
        words = []
        total_lines = 0
        
        try: 
            with open(file_name, "r") as f:
                for line in f:
                    total_lines += 1
                    extracted = self.extract_words(line)
                    words.extend(extracted) 
        #To debug easier :)            
        except FileNotFoundError:
            print(f"Error: File {file_name} not found.")

        return words, total_lines
 
    def calculate_word_frequency(self):
        frequency = {} 
   
        #for bedugging print 
        total_words = sum(len(words) for words in self.category_data.values())
        # print(f"\n--- Full category_data dictionary of length {total_words} ---")
        # print(self.category_data)
        
        #enumerate creates a index for dictionary items  (index, (category, words))
        for i, (category, words) in enumerate(self.category_data.items()): 
            category_index = i
            for word in words: 
                if word in frequency.keys(): #if already in list 
                    frequency[word][category_index] += 1
                else: 
                    freq_list = [0] * len(self.category_data)  # One slot for each category for example we have three in our examples[0,0,0]
                    freq_list[category_index] = 1  
                    frequency[word] = freq_list #add to the dictionary for each word, a list of frequency [cat1,cat2,cat3]
                    
        # print(f"\n--- Calculated Word Frequencies: ---\n {frequency} ")
        return frequency
   
    def calculate_word_probability(self, frequency):
        probability = {} #dictionary to store compiled datat

        total_words_per_category = {category: len(words) for category, words in self.category_data.items()}
        unique_words = len(frequency) 

        for word, counts in frequency.items(): #iterate over each word in dictionary 
            probabilities = [] #for each word we calculate probability in each category
            for i, category_count in enumerate(counts): #loops through the count of freq of word in each category [cat1,cat2,cat3] creating an index for each with enumerate
                total_words_in_category = total_words_per_category[list(self.category_data.keys())[i]] #per key-category, calculate number of words
                prob = (category_count + 1) / (total_words_in_category + unique_words) #Laplace smoothing formula
                probabilities.append(prob) #add probability to current category  
            probability[word] = probabilities #creates an object like key:carbon [prob for cat1, prob for cat 2, prob for cat3] for each word but for each word, adding it to the dictionary 
        
        # print("\n--- Word Probability ---")
        # print(probability)
        return probability	    
    
    def classify(self, text, probability_categories, threshold=0.35):
        words = self.extract_words(text)  #tokenize
        category_scores = {category: 1 for category in self.category_data} #intialize val of 1 for tuple

        for word in words:  #for each word in list of tokenized words 
            if word in probability_categories:  # check if exists in prob. dictionary
                for i, category in enumerate(self.category_data.keys()):  #use enum. to create index for each category in dictionary of cat
                    category_scores[category] *= probability_categories[word][i]
                    #category_scores[category] this refers to the current score for the specific category
                    #multiplies the score of current category by the prob of the current word in that category
                    #probability_categories[word][i] is the probability of the word in the index i of probability dictionary.


        total_score = sum(category_scores.values())
        normalized_scores = {category: score / total_score for category, score in category_scores.items()}

        # Multi-label selection
        selected_categories = [cat for cat, p in normalized_scores.items() if p >= threshold]

        if not selected_categories:
            selected_categories = []  # fallback if nothing is confident

        return normalized_scores, selected_categories

    
    def test_classify(self, unseen_text, probability_categories, threshold=0.35):
        print("\n--- Testing Classification for Unseen Events ---\n")
        
        for text in unseen_text:
            category_scores, selected_categories = self.classify(text, probability_categories, threshold=threshold)
            
            # print(f"TEXT: {text}")
            # print(f"Probabilities: {category_scores}")
            # print(f"Selected Categories (threshold={threshold}): {selected_categories}")
            # print("-" * 50)
            print(f"Finished Naive Bayes classification for {len(unseen_text)} items in {self.language}")
