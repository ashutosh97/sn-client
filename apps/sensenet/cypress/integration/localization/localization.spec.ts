import { pathWithQueryParams } from '../../../src/services/query-string-builder'

describe('Localization', () => {
  beforeEach(() => {
    cy.login()
    cy.visit(pathWithQueryParams({ path: '/', newParams: { repoUrl: Cypress.env('repoUrl') } }))
      .get('[data-test="Localization"]')
      .click()
  })

  it('should contain a row with ActionResources.xml', () => {
    cy.get('.MuiTableCell-root div')
      .contains('ActionResources.xml')
      .should('have.text', 'ActionResources.xml')
      .click({ force: true })
      .parents('[role="row"]')
      .get('.MuiCheckbox-root')
      .should('have.class', 'Mui-checked')
  })

  it('should have the correct items in the right click menu', () => {
    cy.get('.MuiTableCell-root div').contains('ActionResources.xml').rightclick({ force: true })

    const expectedMenuItems = ['Download', 'Browse']

    cy.get('[role="presentation"] li')
      .should('have.length', expectedMenuItems.length)
      .each(($el) => {
        expect(expectedMenuItems).to.include($el.text())
      })

    cy.get('[role="presentation"] [aria-hidden="true" ]:first').click({ force: true })

    cy.get('[role="presentation"] li').should('not.exist')
  })

  it('should open a binary editor with the content of the item on double click', () => {
    cy.get('.MuiTableCell-root div').contains('ActionResources.xml').dblclick({ force: true })

    cy.get('[data-test="editor-title"]').should('have.text', 'ActionResources.xml')

    cy.get('button[aria-label="Cancel"]').click()

    cy.get('[data-test="editor-title"]').should('not.exist')
  })
})
