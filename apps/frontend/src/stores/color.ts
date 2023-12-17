import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useColorStore = defineStore('color', () => {
  const colors = ref<string[]>([
    '#E5A49C',
    '#F6C886',
    '#FBE7AA',
    '#99E3B5',
    '#A6E6E7',
    '#A5A1E1',
    '#D8A4E2',

    '#D34F3E',
    '#F09336',
    '#F7CF5F',
    '#5CC96E',
    '#65CFD0',
    '#597CE2',
    '#B64DC8',

    '#7D2E25',
    '#A84F1D',
    '#CD9C34',
    '#347842',
    '#3B7C7C',
    '#354A87',
    '#6D2D77',

    '#FFFFFF',
    '#CDCDCD',
    '#9C9C9C',
    '#696969',
    '#373737',
    '#000000'
  ])
  const selectedColor = ref<string>()

  return { colors, selectedColor }
})
