import { describe, it, expect } from 'vitest'
import { calculateNewRiskScore, determinePatientStatus } from '../lib/clinical-utils'

describe('Clinical Risk Logic', () => {
  describe('calculateNewRiskScore', () => {
    it('should correctly add a positive delta', () => {
      expect(calculateNewRiskScore(50, 20)).toBe(70)
    })

    it('should not exceed 100', () => {
      expect(calculateNewRiskScore(90, 20)).toBe(100)
    })

    it('should correctly handle a negative delta', () => {
      expect(calculateNewRiskScore(30, -10)).toBe(20)
    })

    it('should not drop below 0', () => {
      expect(calculateNewRiskScore(10, -50)).toBe(0)
    })
  })

  describe('determinePatientStatus', () => {
    it('should mark >= 70 as critical', () => {
      expect(determinePatientStatus(70)).toBe('critical')
      expect(determinePatientStatus(85)).toBe('critical')
    })

    it('should mark 30-69 as monitoring', () => {
      expect(determinePatientStatus(30)).toBe('monitoring')
      expect(determinePatientStatus(45)).toBe('monitoring')
      expect(determinePatientStatus(69)).toBe('monitoring')
    })

    it('should mark < 30 as stable', () => {
      expect(determinePatientStatus(29)).toBe('stable')
      expect(determinePatientStatus(0)).toBe('stable')
    })
  })
})
